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
		$output += `<section> <![>`;
		for (let i = 0; i < 5; i++) {
			$output += `<!^> <p> ${t_fmt(i)} </p> `;
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

For;
