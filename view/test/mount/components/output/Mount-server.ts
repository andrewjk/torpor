const Mount = {
	name: "Mount",
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
			inputElement.value = "hi";
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<input self="${inputElement || ""}"/>`;
		return $output;
	}
}

export default Mount;
