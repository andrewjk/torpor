const Mount = {
	name: "Mount",
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
			inputElement.value = "hi";
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<input this="${inputElement || ""}"/>`;
		return $output;
	}
}

export default Mount;
