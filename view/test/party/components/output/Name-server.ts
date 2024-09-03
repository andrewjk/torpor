const Name = {
	name: "Name",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			name: "John"
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<h1>Hello ${t_fmt($state.name)}</h1>`;
		return $output;
	}
}

export default Name;
