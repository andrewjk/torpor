const SmallTitle = {
	name: "SmallTitle",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<h6> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		}
		$output += `<!]><!> </h6>`;
		return $output;
	}
}

export default SmallTitle;
