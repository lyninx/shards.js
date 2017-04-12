import three from 'three'
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

        this._bind('_render', '_handleResize', '_update', '_create', '_create_layers', '_init_layers', '_setupDOM')
        this._time = 0.0
        this._create()
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
    _create() {
        this.canvas.width = this.element.clientWidth
        this.canvas.height = this.element.clientHeight
        
        this.config.background = this.element.getAttribute("background")         || "#000"
        this.config.zoom = parseFloat(this.element.getAttribute("zoom"))         || 1.0
        this.config.x_offset = parseFloat(this.element.getAttribute("x_offset")) || 0.0
        this.config.y_offset = parseFloat(this.element.getAttribute("y_offset")) || 0.0
        this.config.fov = parseFloat(this.element.getAttribute("fov"))           || 70
    }
    _get_layers() {
        return this.layers
    }
    _init_layers() {
        this._create_layers()
        this._observe_layers()
    }
    _create_layers() {
        this.layers = []
        let children = [].slice.call(this.element.children)
        // wow. this need refactoring
        children.forEach((elem) => {
            let params = this._get_layer_params(elem)
            this.layers.push({
                elem: elem,
                tag: elem.tagName.toLowerCase(),
                params: params
            })
        })
        this.layers.forEach((l) => {
            let layer = l.layer = new Layer(l.tag, l.params, () => {
                // mesh loaded into scene
                console.log("> loaded "+l.tag)
                this._scene.add(layer.mesh)
                l.mesh = layer.mesh
            })
        }) 
    }

    _get_layer_params(elem) {
        let params = {}
        params.svg = elem.getAttribute("src")
        params.color = elem.getAttribute("color") || "#fff"
        params.z_depth = elem.getAttribute("z_depth") || 0.0
        params.scale = elem.getAttribute("scale") || 1.0
        params.animations = []
        let children = [].slice.call(elem.children)
        children.forEach((elem) => {
            // any tag name works
            let anim = {}
            anim.type = elem.getAttribute("type")
            anim.duration = elem.getAttribute("duration")
            anim.delay = elem.getAttribute("delay")
            anim.looping = elem.getAttribute("looping") || false
            params.animations.push(anim)
        })
        return params
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
        let self = this
        this.mutation_observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type == "attributes") {
                    console.log("attributes changed")
                    self._create()
                    self._camera = new THREE.PerspectiveCamera(self.config.fov, self.canvas.width / self.canvas.height, NEAR, FAR)
                    self._camera.position.x = 0.0 + self.config.x_offset
                    self._camera.position.y = 6.0 + self.config.y_offset
                    self._camera.position.z = (32 / self.config.zoom)
                    self._renderer.setClearColor(self.config.background)
                }
            })
        })
        observer.observe(this.element, {
            attributes: true 
        })
        window.addEventListener('resize', this._handleResize)

        this.element.addEventListener('resize', this._handleResize)
        this.shadow.appendChild(this._renderer.domElement)
    }
    _observe_layers(){
        let self = this
        let children = [].slice.call(this.element.children)
        children.forEach((e) => {
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type == "attributes") {
                        console.log("child attributes changed")
                        let modified_layer = self.layers.find((layer) => {
                            return layer.elem === e
                        })
                        modified_layer.elem = e
                        modified_layer.params = self._get_layer_params(e)
                        self._scene.remove(modified_layer.mesh)
                        console.log(self._scene)
                        modified_layer.layer._update(modified_layer.params, (updated_layer) => {
                            modified_layer.mesh = updated_layer.mesh
                            self._scene.add(updated_layer.mesh)   
                        })
                    }
                })
            })
            observer.observe(e, {
                attributes: true 
            })
        })
    }
    _observe_animations(anim_element){
        let self = this
        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type == "attributes") {
                    console.log("animation attributes changed")
                        let modified_layer = self.layers.find((layer) => {
                            return layer.elem === anim_element.parentNode
                        })
                        modified_layer.elem = anim_element.parentNode
                        modified_layer.params = self._get_layer_params(anim_element.parentNode)
                        self._scene.remove(modified_layer.mesh)
                        modified_layer.layer._update(modified_layer.params, (updated_layer) => {
                            modified_layer.mesh = updated_layer.mesh
                            self._scene.add(updated_layer.mesh)   
                        })
                }
            })
        })
        observer.observe(anim_element, {
            attributes: true 
        })    
    }

    _createScene() {
        const scene = this._scene

        this.frame = 0
        this.prev_frame = -1  
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