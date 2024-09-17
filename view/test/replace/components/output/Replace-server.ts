const Replace = {
	name: "Replace",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$props ||= {};

		/* User script */
		let counter = 0;
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <![>`;
		$props.name;
		$output += ` <p>The replace count is ${t_fmt(counter++)}.</p> `;
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default Replace;
