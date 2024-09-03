const IfElse = {
	name: "IfElse",
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
		$output += `<div> <![>`;
		if ($props.counter > 7) {
			$output += ` <p> It's true! </p> `;
		}
		else {
			$output += ` <p> It's not true... </p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default IfElse;
