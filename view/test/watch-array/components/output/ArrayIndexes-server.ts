const ArrayIndexes = {
	name: "ArrayIndexes",
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
		for (let i = 0; i < $props.items.length; i++) {
			$output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt($props.items[i].text)} </span> `;
		}
		$output += `<!]><!> <p>$</p> </section>`;
		return $output;
	}
}

export default ArrayIndexes;
