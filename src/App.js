const three             = require('three')
const reindex           = require('mesh-reindex')
const unindex           = require('unindex-mesh')
const loadSvg           = require('load-svg')
const parsePath         = require('extract-svg-path').parse
const svgMesh           = require('svg-mesh-3d')
const elementResize     = require('element-resize-event')
const createGeom        = require('three-simplicial-complex')(THREE)
const vertShader        = require('./shaders/vertex.glsl')
const fragShader        = require('./shaders/fragment.glsl')

const NEAR = 0.1
const FAR = 2000
const TIMELINE_LENGTH = 256
const WAVE_DIM = 16

let prev_frame = 0.0
let time = 0.0

import animate from './Animate.js'
import util from './Util.js'

export default class App {
    constructor(domElement) {
        this.wave = {}
        this.primary = {}
        this.canvas = {}
        this.element = domElement

        this.params = {}

        this._bind('_render', '_handleResize', '_loadSVG', '_update')
        this._time = 0.0
        this._configure()
        this._setup3D()
        this._setupDOM()
        this._createScene()      
    }

    start() {
        requestAnimationFrame(this._render);
    }

    _bind(...methods) {
        methods.forEach((method) => this[method] = this[method].bind(this))
    }
    _configure() {
        this.canvas.width = this.element.clientWidth
        this.canvas.height = this.element.clientHeight
        
        this.params.svg = this.element.getAttribute("svg")               || ""
        this.params.color = this.element.getAttribute("color")           || "#000"
        this.params.background = this.element.getAttribute("background") || "#fff"
        this.params.zoom = this.element.getAttribute("zoom")             || 1.0
        this.params.animation = this.element.getAttribute("animation")
        this.params.duration = this.element.getAttribute("duration")     || 4000
        this.params.delay = this.element.getAttribute("delay")           || 1000
    }
    _setup3D() {
        const renderer = this._renderer = new THREE.WebGLRenderer({antialias: true})
        renderer.setSize(this.canvas.width, this.canvas.height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setClearColor(0xe0e0e0)

        this._scene = new THREE.Scene()
        this._camera = new THREE.PerspectiveCamera(70, this.canvas.width / this.canvas.height, NEAR, FAR)
        this._camera.position.y = 4
        this._camera.position.z = 32
    }

    _setupDOM() {
        elementResize(this.element, this._handleResize)
        this.element.appendChild(this._renderer.domElement)
    }

    _createScene() {
        const scene = this._scene

        this.frame = 0
        this.prev_frame = -1

        this.wave.dimensions = [WAVE_DIM, WAVE_DIM]
        let wd = this.wave.dimensions
        let geometry = new THREE.PlaneGeometry( wd[0]*4, wd[1]*4, wd[0] , wd[1] )
        geometry.dynamic = true
        geometry.__dirtyVertices = true

        this.wave.material = new THREE.MeshBasicMaterial({
            color: 0xff1111,
            wireframeLinewidth: 2,
            wireframe: true,
            side: THREE.DoubleSide
        })

        this.primary.material = new THREE.ShaderMaterial({
            wireframeLinewidth: 1,
            vertexShader: vertShader,
            fragmentShader: fragShader,
            wireframe: false,
            visible: true,
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
                color: { value: new THREE.Color( 0xff2200 )},
                opacity: { type: 'f', value: 1 },
                scale: { type: 'f', value: 1 },
                animate: { type: 'f', value: 1 }
            }
        })

        // waves mesh
        let mesh = new THREE.Mesh(geometry, this.wave.material)
        mesh.rotation.x = Math.PI / 2
        mesh.rotation.z += 1
        this.wave.mesh = mesh
        scene.add(mesh)
        ////////
        this._loadSVG()
    }

    _update(dt) {
        this._time += dt

        let wave = function(x, y, offset) {
            return 0.5 * ( 0.4 * Math.sin((y / 16) + offset) + Math.sin((x / 2.3) + (-0.4 * offset))
                + Math.sin((x / 4) + offset) + Math.sin((y / 2.8) + offset))
        }
        let dimensions = this.wave.dimensions
        this.wave.mesh.geometry.dynamic = true
        this.wave.mesh.geometry.vertices.forEach((elem, index) => {
            let offset = this._time
            elem.xi = Math.floor(index / (dimensions[1] + 1))
            elem.yi = Math.floor(index % (dimensions[0] + 1))
            elem.z = wave(elem.xi, elem.yi, offset)
        })
        this.wave.mesh.rotation.z += 0.001
        this.wave.mesh.geometry.verticesNeedUpdate = true
    }

    _render(timestamp) {
        const scene = this._scene
        const camera = this._camera
        const renderer = this._renderer

        /// render animation stuff! 
        let dt = (timestamp - prev_frame) / 1000.0
        this._update(dt)

        /// scene rendering
        renderer.render(scene, camera)
        prev_frame = timestamp
        requestAnimationFrame(this._render)
    }

    _handleResize(event) {
        let renderer = this._renderer
        let camera = this._camera
        let canvas = this.element
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    }

    // load svg 
    _loadSVG() {
        var self = this
        this.svg_loaded = false
        // load default SVG asychronously 
        loadSvg(this.params.svg, function (err, svg) {
            if (err) throw err
            load(svg)
        })
        // load svg into scene
        function load(svg){
            let svgPath = parsePath(svg)
            let complex = svgMesh(svgPath, { delaunay: false, scale: 20, randomization: 0 })
            complex = reindex(unindex(complex.positions, complex.cells))
            let svg_geometry = new createGeom(complex)
            let buffer_geometry = new THREE.BufferGeometry().fromGeometry(svg_geometry)
            let attributes = util.getAnimationAttributes(complex.positions, complex.cells)
            buffer_geometry.addAttribute('direction', attributes.direction)
            buffer_geometry.addAttribute('centroid', attributes.centroid)          
            svg_geometry.dispose()
            let mesh = new THREE.Mesh(buffer_geometry, self.primary.material)
            mesh.scale.set( 16, 16, 16 )
            mesh.name = "primary"
            self.svg_loaded = true
            mesh.position.y += 6
            self._scene.add(mesh)
            console.log()
        }
        function clearSVG(){
            self._scene.remove(self._scene.children[1])
        }
    }
}