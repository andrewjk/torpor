const ParentChild = {
	name: "ParentChild",
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
		$output += `<div> `;
		const t_props_1 = {};
		t_props_1["name"] = "Anna";

		$output += Child.render(t_props_1, $context)
		$output += ` </div>`;
		return $output;
	}
}

const Child = {
	name: "Child",
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
		$output += `<h2>Hello, ${t_fmt($props.name)}</h2>`;
		return $output;
	}
}

export default ParentChild;
