const HelloWorld = {
	name: "HelloWorld",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<h1>Hello world</h1>`;
		return $output;
	}
}

export default HelloWorld;
