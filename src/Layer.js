import three from 'three'
import reindex from 'mesh-reindex'
import unindex from 'unindex-mesh'
import loadSvg from 'load-svg'
import { parse as parsePath } from 'extract-svg-path'
import svgMesh from 'svg-mesh-3d'
import elementResize from 'element-resize-event'
import threeSimplicialComplex from 'three-simplicial-complex'
import vertShader from './shaders/vertex.glsl'
import fragShader from './shaders/fragment.glsl'
import Animate from './Animate.js'
import util from './Util.js'

export default class Layer {
    constructor(type, params={}, ready) {
        this.type = type
        this.params = params
        this.mesh = undefined
        this.material = undefined
        this.animations = []
        this.ready = ready

        this._bind('_create', '_loadSVG', '_update')
        this._create() 
    }

    _bind(...methods) {
        methods.forEach((method) => this[method] = this[method].bind(this))
    }

    _create() {
        this.material = new THREE.ShaderMaterial({
            wireframeLinewidth: 1,
            vertexShader: vertShader,
            fragmentShader: fragShader,
            wireframe: false,
            visible: true,
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
                color: { value: new THREE.Color( this.params.color )},
                opacity: { type: 'f', value: 1 },
                scale: { type: 'f', value: 1 },
                animate: { type: 'f', value: 1 },
                spin: { type: 'f', value: 1 }
            }
        })

        this._update(this.params, () => {
            this.ready.call(this, this)
        })
    }
    _destory() {
        delete this
    }

    _update(params, ready) {
        this.params = params
        this._loadSVG().then((mesh) => {
            this.mesh = mesh
            this.animations.forEach((animation, index, array) => {
                animation.stop()
            })
            this.material.uniforms.color.value = new THREE.Color(this.params.color)
            this.params.animations.forEach((anim) => {
                let animation = new Animate(this.material, this.mesh, anim.type, anim.duration, anim.delay)
                animation.play()
                this.animations.push(animation)
            })
            ready(this)
        })

    }

    // load svg 
    _loadSVG() {
        return new Promise((resolve, reject) => {
            let self = this
            // load default SVG asychronously 
            loadSvg(this.params.src, function (err, svg) {
                if (err) reject(err)
                
                let mesh = generate_mesh(svg)
                resolve(mesh)
            })
            // load svg mesh
            function generate_mesh(svg){
                let svgPath = parsePath(svg)
                let complex = svgMesh(svgPath, { delaunay: false, scale: 20, randomization: 0 })
                complex = reindex(unindex(complex.positions, complex.cells))
                const createGeom = threeSimplicialComplex(THREE)
                let svg_geometry = new createGeom(complex)
                let buffer_geometry = new THREE.BufferGeometry().fromGeometry(svg_geometry)
                let attributes = util.getAnimationAttributes(complex.positions, complex.cells)
                buffer_geometry.addAttribute('direction', attributes.direction)
                buffer_geometry.addAttribute('centroid', attributes.centroid)          
                svg_geometry.dispose()

                let mesh = new THREE.Mesh(buffer_geometry, self.material)
                let scale = 16 * self.params.scale
                mesh.scale.set( scale, scale, scale )
                mesh.name = self.params.svg
                mesh.position.y += 6

                return mesh
            }
        })
    }
}