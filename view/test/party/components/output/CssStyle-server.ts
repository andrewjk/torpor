const CssStyle = {
	name: "CssStyle",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <h1 class="title tera-1q0qgpq">I am red</h1> <button style="font-size: 10rem;">I am a button</button> </div>`;
		return $output;
	}
}

export default CssStyle;
