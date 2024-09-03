const IfAfterIf = {
	name: "IfAfterIf",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <![>`;
		if ($props.counter > 10) {
			$output += ` <p> It's true! </p> `;
		}
		$output += `<!]><!> <![>`;
		if ($props.counter > 5) {
			$output += ` <p> It's also true! </p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default IfAfterIf;
