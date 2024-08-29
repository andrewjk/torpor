const Let = {
	name: "Let",
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
		t_props_1["items"] = $props.items;
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops) => {
			let $output = "";
			$output += ` ${t_fmt($sprops.item.text)} `;
			return $output;
		}
		$output += List.render(t_props_1, t_slots_1, $context)
		return $output;
	}
}

Let;
