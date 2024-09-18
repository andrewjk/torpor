const Element = {
	name: "Element",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<${$props.tag}> Hello! </${$props.tag}>`;
		return $output;
	}
}

export default Element;
