import App from './App'

require('./css/style.scss')


class WebGLComposerElement extends HTMLElement {
	constructor() {
		super()
		this.shadow = this.attachShadow({mode: 'open'})
	}
	connectedCallback() {
		this.style.display = "block"
		this.app = new App(this, this.shadow)
		this.app.start()
	}
}

class LayerElement extends HTMLElement{
	static get observedAttributes() {return ['src', 'color', 'x_offset', 'y_offset', 'z_depth', 'scale']; }
	constructor() {
		super()
	}
	connectedCallback() {
		console.log("CONNECTED CALLBACK")
		this.app = this.parentNode.app
		this.app._create_layer(this)
	}
	attributeChangedCallback(attribute, oldValue, newValue) {
		if(this.parentNode) {
			this.parentNode.app._update_layer(this, attribute, newValue)	
		}
	}
	disconnectedCallback(){
		console.log("DISCONNECT")
		this.app._remove_layer(this)
	}
}

class AnimationElement extends HTMLElement{
	static get observedAttributes() { return ['type', 'duration', 'delay', 'looping'] }
	constructor() {
		super()
	}
	connectedCallback() {
		console.log("ANIMATION ATTACHED")
		this.app = this.parentNode.app
		this.layerNode = this.parentNode
		this.app._update_animations(this)
	}
	attributeChangedCallback(attribute, oldValue, newValue) {
		console.log(attribute + " changed!")
		if(this.parentNode.app) {
			this.parentNode.app._update_animations(this)
		}
	}
	disconnectedCallback(){
		console.log("REMOVED ANIMATION")
		this.app._update_animations(this)
	}
}
customElements.define('webgl-composer', WebGLComposerElement)
customElements.define('c-layer', LayerElement)
customElements.define('c-animation', AnimationElement)
