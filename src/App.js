import three from 'three'
import reindex from 'mesh-reindex'
import unindex from 'unindex-mesh'
import loadSvg from 'load-svg'
import { parse as parsePath } from 'extract-svg-path'
import svgMesh from 'svg-mesh-3d'
import elementResize from 'element-resize-event'
import createGeom from 'three-simplicial-complex'
import vertShader from './shaders/vertex.glsl'
import fragShader from './shaders/fragment.glsl'
import Animate from './Animate.js'
import Layer from './Layer.js'
import util from './Util.js'

const NEAR = 0.1
const FAR = 2000
const WAVE_DIM = 16

let prev_frame = 0.0
let time = 0.0

export default class App {
    constructor(domElement, shadow) {
        this.canvas = {}
        this.element = domElement
        this.shadow = shadow
        this.config = {}

        this._bind('_render', '_handleResize', '_update', '_configure', '_configure_layers', '_setupDOM')
        this._time = 0.0
        this._configure()
        this._configure_layers()
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
        
        this.config.background = this.element.getAttribute("background")         || "#000"
        this.config.zoom = parseFloat(this.element.getAttribute("zoom"))         || 1.0
        this.config.x_offset = parseFloat(this.element.getAttribute("x_offset")) || 0.0
        this.config.y_offset = parseFloat(this.element.getAttribute("y_offset")) || 0.0
        this.config.fov = parseFloat(this.element.getAttribute("fov"))           || 70
    }

    _configure_layers() {
        this.layers = []
        let children = [].slice.call(this.element.children)
        children.forEach((elem) => {
            let config = {}
            config.svg = elem.getAttribute("src")
            config.color = elem.getAttribute("color") || "#fff"
            config.z_depth = elem.getAttribute("z_depth") || 0.0
            config.scale = elem.getAttribute("scale") || 1.0
            config.animation = elem.getAttribute("animation")
            config.duration = parseFloat(elem.getAttribute("duration")) || 4.0
            config.delay = parseFloat(elem.getAttribute("delay")) || 1.0
            this.layers.push({
                elem: elem,
                tag: elem.tagName.toLowerCase(),
                params: config
            })
        })
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
        // elementResize(this.element, this._handleResize)
        let self = this
        this.mutation_observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type == "attributes") {
                    console.log("attributes changed")
                    self._configure()
                    self._camera = new THREE.PerspectiveCamera(self.config.fov, self.canvas.width / self.canvas.height, NEAR, FAR)
                    self._camera.position.x = 0.0 + self.config.x_offset
                    self._camera.position.y = 6.0 + self.config.y_offset
                    self._camera.position.z = (32 / self.config.zoom)
                    self._renderer.setClearColor(self.config.background)
                    console.log(self._camera)
                }
            })
        })
        observer.observe(this.element, {
            attributes: true 
        })
        let children = [].slice.call(this.element.children)
        children.forEach((e) => {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type == "attributes") {
                        console.log("child attributes changed")
                        const meow = self.layers.find((layer) => {
                            return layer.elem === e
                        })
                        console.log(meow)
                    }
                })
            })
            observer.observe(e, {
                attributes: true 
            })
        })
        window.addEventListener('resize', this._handleResize)

        this.element.addEventListener('resize', this._handleResize)
        this.shadow.appendChild(this._renderer.domElement)
    }

    _createScene() {
        const scene = this._scene

        this.frame = 0
        this.prev_frame = -1

        this.layers.forEach((l) => {
            let layer = new Layer(l.tag, l.params, () => {
                // mesh loaded into scene
                console.log("> loaded "+l.tag)
                scene.add(layer.mesh)
                // start layer animation
                let anim = new Animate(layer.material, l.params.animation, l.params.duration, l.params.delay)
                anim.play()
            })
        })
    
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