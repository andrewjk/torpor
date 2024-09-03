const InputFocused = {
	name: "InputFocused",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $mount = (fn) => null;
		let inputElement;

		$mount(() => {
			// HACK: This is easier to test for
			inputElement.value = "hi";
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<input this="${inputElement || ""}"/>`;
		return $output;
	}
}

export default InputFocused;
