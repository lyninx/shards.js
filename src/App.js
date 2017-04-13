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
        this.layers = []

        this._bind('_render', '_handleResize', '_update', '_create', '_create_layer', '_update_layer', '_setupDOM')
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
    _create_layer(elem) {
        let params = this._get_layer_params(elem)
        let tag = elem.tagName.toLowerCase()
        let layer = new Layer(tag, params, (layer) => {
            this._scene.add(layer.mesh)
            this.layers.push({
                elem: elem,
                tag: tag,
                params: params,
                layer: layer,
                mesh: layer.mesh
            })
        })
    }
    _update_layer(elem, attribute, value) {
        let modified = this.layers.find((layer) => {
            return layer.elem == elem
        })
        if(modified) {
            modified.params[attribute] = value
            let old_mesh = modified.mesh
            this._scene.remove(old_mesh)
            modified.layer._update(modified.params, (updated_layer) => {
                console.log("updated layer params")
                this._scene.add(updated_layer.mesh)
                modified.mesh = updated_layer.mesh
            })
        }
    }
    _remove_layer(elem) {
        let scene = this._scene
        let removed = this.layers.find((layer) => {
            return layer.elem == elem
        })
        scene.remove(removed.mesh)
        this.layers = this.layers.filter((item) => {
            return item != removed
        })
        removed.layer._destory()
    }
    // _update_animation(elem) {
    //     let params = this._get_animation_params(elem)
    //     let layer = this.layers.find((layer) => {
    //         return layer.elem == elem.layerNode
    //     })
    //     console.log(layer.layer)
    //     layer.layer._update_animation(params)
    // }
    _update_animations(elem){
        let layer = this.layers.find((layer) => {
            return layer.elem == elem.layerNode
        })
        if(layer){
            let params = this._get_layer_params(elem.layerNode)
            layer.layer._update(params, (updated_layer) => {
                console.log("updated layer params")
            })
        }
    }
    _get_layer_params(elem) {
        let params = {}
        params.src = elem.getAttribute("src")
        params.color = elem.getAttribute("color") || "#fff"
        params.z_depth = elem.getAttribute("z_depth") || 0.0
        params.x_offset = elem.getAttribute("x_offset") || 0.0
        params.y_offset = elem.getAttribute("y_offset") || 0.0
        params.scale = elem.getAttribute("scale") || 1.0
        params.animations = []
        let children = [].slice.call(elem.children)
        children.forEach((elem) => {
            // any tag name works
            params.animations.push(this._get_animation_params(elem))
        })
        return params
    }
    _get_animation_params(elem){
        let anim = {}
        anim.elem = elem
        anim.type = elem.getAttribute("type")
        anim.duration = elem.getAttribute("duration")
        anim.delay = elem.getAttribute("delay")
        anim.looping = elem.getAttribute("looping") || false
        return anim
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