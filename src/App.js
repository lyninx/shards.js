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

import Animate from './Animate.js'
import Layer from './Layer.js'
import util from './Util.js'

export default class App {
    constructor(domElement) {
        this.wave = {}
        this.canvas = {}
        this.element = domElement

        this.config = {}

        this._bind('_render', '_handleResize', '_update')
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
        
        this.config.svg = this.element.getAttribute("svg")                       || ""
        this.config.color = this.element.getAttribute("color")                   || "#000"
        this.config.background = this.element.getAttribute("background")         || "fff"
        this.config.zoom = parseFloat(this.element.getAttribute("zoom"))         || 1.0
        this.config.x_offset = parseFloat(this.element.getAttribute("x_offset")) || 0.0
        this.config.y_offset = parseFloat(this.element.getAttribute("y_offset")) || 0.0
        this.config.fov = parseFloat(this.element.getAttribute("fov"))           || 70
        this.config.animation = this.element.getAttribute("animation")
        this.config.duration = parseFloat(this.element.getAttribute("duration")) || 4.0
        this.config.delay = parseFloat(this.element.getAttribute("delay"))       || 1.0
    }

    _setup3D() {
        const renderer = this._renderer = new THREE.WebGLRenderer({antialias: true})
        renderer.setSize(this.canvas.width, this.canvas.height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setClearColor(this.config.background)

        this._scene = new THREE.Scene()
        this._camera = new THREE.PerspectiveCamera(this.config.fov, this.canvas.width / this.canvas.height, NEAR, FAR)
        this._camera.position.x = 0.0 + this.config.x_offset
        this._camera.position.y = 6.0 + this.config.y_offset
        this._camera.position.z = (32 / this.config.zoom)
    }

    _setupDOM() {
        elementResize(this.element, this._handleResize)
        this.element.appendChild(this._renderer.domElement)
    }

    _createScene() {
        const scene = this._scene

        this.frame = 0
        this.prev_frame = -1

        let l1 = new Layer("svg", { src: "./lyninx.svg"}, () => {
            console.log(l1)
            scene.add(l1.mesh)
        })
        
        let anim = new Animate(l1.material, "explode",this.config.duration, this.config.delay)
        anim.play()
    }

    _update(dt) {
        this._time += dt


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
}