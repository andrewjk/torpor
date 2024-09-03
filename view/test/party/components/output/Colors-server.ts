const Colors = {
	name: "Colors",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const colors = ["red", "green", "blue"];
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<ul> <![>`;
		for (let color of colors) {
			$output += `<!^>  <li>${t_fmt(color)}</li> `;
		}
		$output += `<!]><!> </ul>`;
		return $output;
	}
}

export default Colors;
