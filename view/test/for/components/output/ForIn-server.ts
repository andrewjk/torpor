const ForIn = {
	name: "ForIn",
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
		$output += `<section> <![>`;
		for (let key in $props.item) {
			$output += `<!^> <p> ${t_fmt($props.item[key])} </p> `;
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

export default ForIn;
