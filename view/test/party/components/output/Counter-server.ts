const Counter = {
	name: "Counter",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
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
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <p>Counter: ${t_fmt($state.count)}</p> <button>+1</button> </div>`;
		return $output;
	}
}

export default Counter;
