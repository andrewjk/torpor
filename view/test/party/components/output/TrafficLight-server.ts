const TrafficLight = {
	name: "TrafficLight",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		/* User script */
		const $watch = (obj) => obj;
		const TRAFFIC_LIGHTS = ["red", "orange", "green"];
		let $state = $watch({
			lightIndex: 0,
			get light() {
				return TRAFFIC_LIGHTS[this.lightIndex];
			}
		});

		function nextLight() {
			$state.lightIndex = ($state.lightIndex + 1) % TRAFFIC_LIGHTS.length;
		}
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <button>Next light</button> <p>Light is: ${t_fmt($state.light)}</p> <p> You must <![>`;
		if ($state.light === "red") {
			$output += ` <span>STOP</span> `;
		}
		else if ($state.light === "orange") {
			$output += ` <span>SLOW DOWN</span> `;
		}
		else if ($state.light === "green") {
			$output += ` <span>GO</span> `;
		}
		$output += `<!]><!> </p> </div>`;
		return $output;
	}
}

export default TrafficLight;
