const Object = {
	name: "Object",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <p> ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.item.itemText)} </p> </div>`;
		return $output;
	}
}

export default Object;
