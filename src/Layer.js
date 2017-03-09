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

import util from './Util.js'

export default class Layer {
    constructor(type, params={}, ready) {
        this.type = type
        this.params = params
        this.mesh = undefined
        this.material = undefined
        this.ready = ready

        this._bind('_loadSVG')
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
                color: { value: new THREE.Color( 0xff2200 )},
                opacity: { type: 'f', value: 1 },
                scale: { type: 'f', value: 1 },
                animate: { type: 'f', value: 1 }
            }
        })

        this._loadSVG().then((mesh) => {
            this.mesh = mesh
            this.ready.call()
        })
        //let anim = new Animate(this.primary.material, "explode",this.config.duration, this.config.delay)
        //anim.play()
    }


    // load svg 
    _loadSVG() {
        return new Promise((resolve, reject) => {
            let self = this
            // load default SVG asychronously 
            loadSvg(this.params.svg, function (err, svg) {
                if (err) reject(err)
                let mesh = generate_mesh(svg)
                resolve(mesh)
            })
            // load svg mesh
            function generate_mesh(svg){
                let svgPath = parsePath(svg)
                let complex = svgMesh(svgPath, { delaunay: false, scale: 20, randomization: 0 })
                complex = reindex(unindex(complex.positions, complex.cells))

                let svg_geometry = new createGeom(complex)
                let buffer_geometry = new THREE.BufferGeometry().fromGeometry(svg_geometry)
                let attributes = util.getAnimationAttributes(complex.positions, complex.cells)
                buffer_geometry.addAttribute('direction', attributes.direction)
                buffer_geometry.addAttribute('centroid', attributes.centroid)          
                svg_geometry.dispose()

                let mesh = new THREE.Mesh(buffer_geometry, self.material)
                mesh.scale.set( 16, 16, 16 )
                mesh.name = "primary"
                mesh.position.y += 6

                return mesh
            }
        })
    }
}