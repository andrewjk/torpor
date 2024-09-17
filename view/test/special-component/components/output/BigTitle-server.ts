const BigTitle = {
	name: "BigTitle",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<h2> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		}
		$output += `<!]><!> </h2>`;
		return $output;
	}
}

export default BigTitle;
