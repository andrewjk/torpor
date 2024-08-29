const Component = {
	name: "Component",
	/**
	* @param {Object} [$props]
	* @param {Object} [$slots]
	* @param {Object} [$context]
	*/
	render: ($props, $slots, $context) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		const t_props_1 = {};
		t_props_1["name"] = "Amy";
		$output += Header.render(t_props_1, undefined, $context)
		return $output;
	}
}

Component;
