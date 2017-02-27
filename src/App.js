const three             = require('three')
const reindex           = require('mesh-reindex')
const unindex           = require('unindex-mesh')
const loadSvg           = require('load-svg')
const parsePath         = require('extract-svg-path').parse
const svgMesh           = require('svg-mesh-3d')
const elementResize     = require('element-resize-event')
const createGeom        = require('three-simplicial-complex')(THREE)
const orbitControls     = require('three-orbit-controls')(THREE)
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
        this.canvas.element = domElement
        this.animation = {}

        this._bind('_render', '_handleResize', '_animate', '_loadSVG', '_update')
        this._time = 0.0
        this._init()
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
    _init() {
        this.canvas.width = this.canvas.element.clientWidth
        this.canvas.height = this.canvas.element.clientHeight
        console.log(this.canvas)
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
        window.anim = this._animate
        window.loadSVG = this._loadSVG
        //this.canvas.element.addEventListener('resize', this._handleResize)
        elementResize(this.canvas.element, this._handleResize)
        this.canvas.element.appendChild(this._renderer.domElement)

        let vp = document.getElementById("viewport")
        //this._controls = new orbitControls(this._camera, vp)

        this.animation.play = true
        this.animation.events = []
    }

    _createScene() {
        const scene = this._scene

        this.animation.frame = 0
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
        this._loadSVG(true)
    }

    _update(dt) {
        this._time += dt
        let animation_event = this.animation.events[this.animation.frame]

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
        let canvas = this.canvas.element
        camera.aspect = canvas.clientWidth / canvas.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    }

    _animate() { 
        this.animation.play = !this.animation.play
    }

    // load svg 
    _loadSVG(init = false) {
        var self = this
        this.svg_loaded = false
        if(init){
            // load default SVG asychronously 
            loadSvg('lyninx.svg', function (err, svg) {
                if (err) throw err
                load(svg)
            })
        } else {
            let input = document.getElementById("svg-input")
            var fReader = new FileReader()
            fReader.readAsDataURL(input.files[0])
            fReader.onloadend = function(event){
                let svg = atob(event.target.result.split(",")[1])
                // TODO: check if input is a valid SVG
                clearSVG()
                load(svg)

            }        
        }
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