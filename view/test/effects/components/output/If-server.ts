const If = {
	name: "If",
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
			$output += ` <p>It's big</p> `;
		}
		else {
			$output += ` <p>It's small</p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default If;
