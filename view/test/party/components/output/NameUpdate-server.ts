const NameUpdate = {
	name: "NameUpdate",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			name: "John"
		});
		$state.name = "Jane"
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<h1>Hello ${t_fmt($state.name)}</h1>`;
		return $output;
	}
}

export default NameUpdate;
