import App from './App'

require('./css/style.scss')


class ShardsElement extends HTMLElement {
	constructor() {
		super()
		console.log("constructor!")
		this.shadow = this.attachShadow({mode: 'open'})
	}
	connectedCallback() {
		this.style.display = "block"
		let app = new App(this, this.shadow)
		app.start()
	}
}
customElements.define('shards-canvas', ShardsElement);
