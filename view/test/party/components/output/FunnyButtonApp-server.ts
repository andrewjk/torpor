const FunnyButtonApp = {
	name: "FunnyButtonApp",
	/**
	* @param {Object} [$props]
	* @param {Object} [$slots]
	* @param {Object} [$context]
	*/
	render: ($props, $slots, $context) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> `;
		$output += FunnyButton.render(undefined, undefined, $context)
		$output += ` `;
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops) => {
			let $output = "";
			$output += `Click me!`;
			return $output;
		}
		$output += FunnyButton.render(undefined, t_slots_1, $context)
		$output += ` </div>`;
		return $output;
	}
}

FunnyButtonApp;
