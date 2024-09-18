const Increment = {
	name: "Increment",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		const $state = $watch({ counter: 0 })

		function increment(e, num) {
			$state.counter += num || 1;
		}
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <button id="increment"> Increment </button> <button id="increment5"> Increment </button> <p> The count is ${t_fmt($state.counter)}. </p> </div>`;
		return $output;
	}
}

export default Increment;
