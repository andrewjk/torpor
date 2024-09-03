const Attributes = {
	name: "Attributes",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div ${$props.thing ? `thing="${$props.thing}"` : ''} ${$props.dataThing ? `data-thing="${$props.dataThing}"` : ''}> Hello! </div>`;
		return $output;
	}
}

export default Attributes;
