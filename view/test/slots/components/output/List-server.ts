const List = {
	name: "List",
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
		$output += `<ul> <![>`;
		for (let item of $props.items) {
			$output += `<!^> <li> <![>`;
			const t_sprops_1 = {};
			t_sprops_1["item"] = item;
			if ($slots && $slots["_"]) {
				$output += $slots["_"](t_sprops_1, $context);
			}
			$output += `<!]><!> </li> `;
		}
		$output += `<!]><!> </ul>`;
		return $output;
	}
}

export default List;
