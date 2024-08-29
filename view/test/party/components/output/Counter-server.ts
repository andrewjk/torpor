const Counter = {
	name: "Counter",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			count: 0
		});

		function incrementCount() {
			$state.count++;
		}
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <p>Counter: ${t_fmt($state.count)}</p> <button>+1</button> </div>`;
		return $output;
	}
}

Counter;
