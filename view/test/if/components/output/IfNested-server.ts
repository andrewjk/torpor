const IfNested = {
	name: "IfNested",
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
		if ($props.counter > 5) {
			$output += ` <![>`;
			if ($props.counter > 10) {
				$output += ` <p> It's both true! </p> `;
			}
			else {
				$output += ` <p> The second is not true! </p> `;
			}
			$output += `<!]><!> `;
		}
		else {
			$output += ` <p> The first is not true! </p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default IfNested;
