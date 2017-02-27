import App from './App'

require('./css/style.scss')

// TODO: use polymer web components in the future
// 		 inherit from HTMLCanvasElement when browser support allows
class ShardsElement extends HTMLElement {
  connectedCallback() {
  	this.style.display = "block"
  }
}
customElements.define('shards-canvas', ShardsElement);

document.addEventListener('DOMContentLoaded', function() {
	console.log("DOM loaded")
	let elems = document.getElementsByTagName("shards-canvas")
	let app = new App(elems[0])
	app.start()
})