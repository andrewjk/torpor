const Const = {
	name: "Const",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> `;
		const name = "Boris";
		$output += ` <p> Hello, ${t_fmt(name)}! </p> </div>`;
		return $output;
	}
}

export default Const;
