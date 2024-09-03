const InputHello = {
	name: "InputHello",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			text: "Hello World"
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <p>${t_fmt($state.text)}</p> <input value="${$state.text || ""}"/></div>`;
		return $output;
	}
}

export default InputHello;
