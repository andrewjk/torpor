const For = {
	name: "For",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <![>`;
		for (let item of $props.items) {
			$output += `<!^> <p>${t_fmt(item.text)}</p> `;
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

For;
