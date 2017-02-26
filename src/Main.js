import App from './App'

require('./css/style.scss')

let controls = document.getElementById("bottom")

document.addEventListener('DOMContentLoaded', function() {
	console.log("DOM loaded")
	let app = new App(document.getElementById("shards"))
	app.start()
})