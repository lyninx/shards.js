import App from './App'

require('./css/style.scss')


class WebGLComposerElement extends HTMLElement {
	constructor() {
		super()
		this.shadow = this.attachShadow({mode: 'open'})
	}
	connectedCallback() {
		console.log("CONNECTED")
		this.style.display = "block"
		this.app = new App(this, this.shadow)
		this.app.start()
	}
	connectedLayer() {

	}
}

class LayerElement extends HTMLElement{
	constructor() {
		super()
	}
	connectedCallback() {
		this.parentNode.app._init_layers()
		this.app = this.parentNode.app
	}
}

class AnimationElement extends HTMLElement{
	static get observedAttributes() { return ['type', 'duration', 'delay', 'looping'] }
	constructor() {
		super()
	}
	connectedCallback() {
		this.parentNode.app._observe_animations(this)
	}
}
customElements.define('webgl-composer', WebGLComposerElement)
customElements.define('c-layer', LayerElement)
customElements.define('c-animation', AnimationElement)
