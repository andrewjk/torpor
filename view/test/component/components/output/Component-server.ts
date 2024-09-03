import Header from './Header.tera';

const Component = {
	name: "Component",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		const t_props_1 = {};
		t_props_1["name"] = "Amy";

		$output += Header.render(t_props_1, $context)
		return $output;
	}
}

export default Component;
