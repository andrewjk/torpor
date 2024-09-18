const Article = {
	name: "Article",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<section> <h2> <![>`;
		if ($slots && $slots["header"]) {
			$output += $slots["header"](undefined, $context);
		}
		$output += `<!]><!> </h2> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		}
		$output += `<!]><!> <![>`;
		if ($slots && $slots["footer"]) {
			$output += $slots["footer"](undefined, $context);
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

export default Article;
