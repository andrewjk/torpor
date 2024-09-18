const For = {
	name: "For",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<section> <![>`;
		for (let i = 0; i < 5; i++) {
			$output += `<!^> <p> ${t_fmt(i)} </p> `;
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

export default For;
