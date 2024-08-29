const ForIn = {
	name: "ForIn",
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
		for (let key in $props.item) {
			$output += `<!^> <p> ${t_fmt($props.item[key])} </p> `;
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

ForIn;
