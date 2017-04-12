const Tweenr 	= require('tweenr')
const tweenr = Tweenr({ defaultEase: 'expoOut' })

export default class Animate {
	constructor(material, mesh, animation, duration = 4.0, delay = 1.0) {
		this.duration = parseFloat(duration)
		this.delay = parseFloat(delay)
		this.animation = animation
		this.mesh = mesh
		this.material = material
		this._bind('play', 'explode')
		this.enabled = true
	}

	_bind(...methods) {
		methods.forEach((method) => this[method] = this[method].bind(this));
	}

	play() {
		switch(this.animation) {
			case "fade-in":
				this.material.uniforms.opacity.value = 0.0;
				this.fade_in(this.duration, this.delay)
				this.animation = "fade-out"
				break
			case "fade-out":
				this.material.uniforms.opacity.value = 1.0;
				this.fade_out(this.duration, this.delay)
				this.animation = "fade-in"
				break
			case "spin":
				this.spin(this.duration, this.delay)
				break
			case "explode": 
				this.explode(this.duration, this.delay)
				this.animation = "implode"
				break
			case "implode":
				this.implode(this.duration)
				this.animation = "explode"
				break
			default: console.warn("invalid animation parameter")
		}
	}

	stop() {
		this.enabled = false
		console.log("animation cancelled")
		this.tween.cancel()
		this.material.uniforms.animate.value = 1.0
		this.material.uniforms.opacity.value = 1.0
		this.material.uniforms.spin.value = 1.0
	}
	fade_in(dur, delay=0){
		this.tween = tweenr.to(this.material.uniforms.opacity, {
			duration: dur, 
			value: 1, 
			delay: delay, 
			ease: 'linear'
		}).on('complete', () => {
			if (this.enabled) this.play()
		})
	}
	fade_out(dur, delay=0){
		this.tween = tweenr.to(this.material.uniforms.opacity, {
			duration: dur, 
			value: 0, 
			delay: delay, 
			ease: 'linear'
		}).on('complete', () => {
			if (this.enabled) this.play()
		})
	}
	spin(dur, delay=0){
		this.tween = tweenr.to(this.material.uniforms.spin, {
			duration: dur, 
			value: 0, 
			delay: delay, 
			ease: 'linear'
		}).on('complete', () => {
			this.material.uniforms.spin.value = 1.0;
			if (this.enabled) this.play()
		})
	}

	explode(dur, delay = 0){
		this.tween = tweenr.to(this.material.uniforms.animate, {
			duration: dur, 
			value: 0, 
			delay: delay, 
			ease: 'circOut'
		}).on('complete', () => {
			if (this.enabled) this.play()
		})
	}

	implode(material, delay = 0) {
		this.tween = tweenr.to(this.material.uniforms.animate, {
			duration: 2.0, 
			value: 1, 
			delay: delay, 
			ease: 'quadInOut'
		}).on('complete', () => {
			if (this.enabled) this.play()
		})
	}
}