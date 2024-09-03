const BindText = {
	name: "BindText",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({ name: "Alice" });
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <input value="${$state.name || ""}"/> <p>Hello, ${t_fmt($state.name)}</p> </div>`;
		return $output;
	}
}

export default BindText;
