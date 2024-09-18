const Function = {
	name: "Function",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({ counter: 0 })
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <button id="increment">Increment</button> `;

		function increment() {
			$state.counter += 1;
		};

		$output += ` <p> The count is ${t_fmt($state.counter)}. </p> </div>`;
		return $output;
	}
}

export default Function;
