const Self = {
	name: "Self",
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
		$output += `<div> Level ${t_fmt($props.level)} <![>`;
		if ($props.level < 3) {
			$output += ` `;
			const t_props_1 = {};
			t_props_1["level"] = $props.level + 1;

			$output += Self.render(t_props_1, $context)
			$output += ` `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default Self;
