const Tweenr 	= require('tweenr')
const tweenr = Tweenr({ defaultEase: 'expoOut' })

export default class Animate {
	constructor(material, animation, duration = 4.0, delay = 1.0) {
		this.duration = duration
		this.delay = delay
		this.animation = animation
		this.material = material
		this._bind('play', 'explode')

	}

	_bind(...methods) {
		methods.forEach((method) => this[method] = this[method].bind(this));
	}

	play() {
		switch(this.animation) {
			case "explode": 
				this.explode(this.duration, this.delay)
				this.animation = "implode"
				break
			case "implode":
				this.implode(this.duration)
				this.animation = "explode"
				break
			default: console.log("invalid animation")
		}
	}

	explode(dur, delay = 0){
		tweenr.to(this.material.uniforms.animate, {
			duration: dur, 
			value: 0, 
			delay: delay, 
			ease: 'circOut'
		})
		tweenr.to(this.material.uniforms.scale, {
			duration: dur, 
			value: 0, 
			delay: delay
		}).on('complete', () => {
			this.play()
		})
	}

	implode(material, delay = 0) {
		tweenr.to(this.material.uniforms.animate, {
			duration: 2.0, 
			value: 1, 
			delay: delay, 
			ease: 'quadInOut'
		})
		tweenr.to(this.material.uniforms.scale, {
			duration: 2.0, 
			value: 1, 
			delay: delay
		}).on('complete', () => {
			this.play()
		})
	}
}