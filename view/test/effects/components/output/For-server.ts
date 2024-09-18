const For = {
	name: "For",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <![>`;
		for (let item of $props.items) {
			$output += `<!^> <p>${t_fmt(item.text)}</p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default For;
