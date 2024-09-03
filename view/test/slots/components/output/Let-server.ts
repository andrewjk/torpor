import List from './List.tera';

const Let = {
	name: "Let",
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
		const t_props_1 = {};
		t_props_1["items"] = $props.items;
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += ` ${t_fmt($sprops.item.text)} `;
			return $output;
		}

		$output += List.render(t_props_1, $context, t_slots_1)
		return $output;
	}
}

export default Let;
