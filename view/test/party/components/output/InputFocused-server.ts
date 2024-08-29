const InputFocused = {
	name: "InputFocused",
	/**
	* @param {Object} [$props]
	* @param {Object} [$slots]
	* @param {Object} [$context]
	*/
	render: ($props, $slots, $context) => {
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

InputFocused;
