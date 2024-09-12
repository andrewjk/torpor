const ArrayUnkeyed = {
	name: "ArrayUnkeyed",
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
		$output += `<section> <p>^</p> <![>`;
		for (let item of $props.items) {
			$output += `<!^> <p> ${t_fmt(item.text)} </p> `;
		}
		$output += `<!]><!> <p>$</p> </section>`;
		return $output;
	}
}

export default ArrayUnkeyed;
