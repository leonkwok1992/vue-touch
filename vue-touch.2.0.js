;
(function() {

	var vueTouch = {}
	var Hammer = (typeof require === 'function') ? require('hammerjs') : window.Hammer;
	var gestures = ['tap', 'pan', 'pinch', 'press', 'rotate', 'swipe']
	var directions = ['up', 'down', 'left', 'right', 'horizontal', 'vertical', 'all']
	var customEvents = {}

	if(!Hammer) {
		throw new Error('[vue-touch] cannot locate Hammer.js.')
	}

	// exposed global options
	vueTouch.config = {}

	vueTouch.install = function(Vue) {

		Vue.directive('touch', {
			isFn: true,
			acceptStatement: true,
			//priority: Vue.directive('on').priority,

			bind: function(el, binding, vnode) {
				if(!el.hammer) {
					el.hammer = new Hammer.Manager(el);
				}
				var mc = el.mc = el.hammer;
				// determine event type
				var event = binding.arg;
				if(!event) {
					console.warn('[vue-touch] event type argument is required.');
				}
				var recognizerType, recognizer;

				if(customEvents[event]) {
					// custom event
					var custom = customEvents[event];
					recognizerType = custom.type;
					recognizer = new Hammer[capitalize(recognizerType)](custom);
					recognizer.recognizeWith(mc.recognizers);
					mc.add(recognizer);
				} else {
					// built-in event
					for(var i = 0; i < gestures.length; i++) {
						if(event.indexOf(gestures[i]) === 0) {
							recognizerType = gestures[i];
							break;
						}
					}
					if(!recognizerType) {
						console.warn('[vue-touch] invalid event type: ' + event)
						return
					}
					recognizer = mc.get(recognizerType);
					if(!recognizer) {
						// add recognizer
						recognizer = new Hammer[capitalize(recognizerType)]()
						// make sure multiple recognizers work together...
						recognizer.recognizeWith(mc.recognizers)
						mc.add(recognizer)
					}
					// apply global options
					var globalOptions = vueTouch.config[recognizerType]
					if(globalOptions) {
						guardDirections(globalOptions)
						recognizer.set(globalOptions)
					}
					// apply local options
					var localOptions = el.hammerOptions && el.hammerOptions[recognizerType];
					console.log(el.hammerOptions);
					if(localOptions) {
						guardDirections(localOptions)
						recognizer.set(localOptions)
					}
				}
				el.recognizer = recognizer
				
				var fn = binding.value;
				if(el.handler) {
					mc.off(event, el.handler)
				}
				
				if(typeof fn !== 'function') {
					console.warn( '[vue-touch] invalid handler function for v-touch: ' + binding.arg + '="' + binding.value);
				}else{
					mc.on(event, (el.handler = fn))
					
				}
				
				
			},
		
			unbind: function(el,binding) {
				if(el.handler) {
					el.mc.off(binding.arg, el.handler)
				}
				if(!Object.keys(el.mc.handlers).length) {
					el.mc.destroy()
					el.hammer = null
				}
			}
		})
		
		Vue.directive('touch-options', {
			//priority: Vue.directive('on').priority + 1,
			bind: function(el,binding) {
				var opts = el.hammerOptions || (el.hammerOptions = {})
				console.log(opts);
				if(!binding.arg) {
					console.warn('[vue-touch] recognizer type argument for v-touch-options is required.')
				} else {
					opts[binding.arg] = binding.value;
				}
			}
		})
	}

	/**
	 * Register a custom event.
	 *
	 * @param {String} event
	 * @param {Object} options - a Hammer.js recognizer option object.
	 *                           required fields:
	 *                           - type: the base recognizer to use for this event
	 */

	vueTouch.registerCustomEvent = function(event, options) {
		options.event = event
		customEvents[event] = options
	}

	function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1)
	}

	function guardDirections(options) {
		var dir = options.direction
		if(typeof dir === 'string') {
			var hammerDirection = 'DIRECTION_' + dir.toUpperCase()
			if(directions.indexOf(dir) > -1 && Hammer.hasOwnProperty(hammerDirection)) {
				options.direction = Hammer[hammerDirection]
			} else {
				console.warn('[vue-touch] invalid direction: ' + dir)
			}
		}
	}


	window.VueTouch = vueTouch
	Vue.use(vueTouch)

})()