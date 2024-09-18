const Header = {
	name: "Header",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<h2> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		} else {
			$output += ` Default header... `;
		}
		$output += `<!]><!> </h2>`;
		return $output;
	}
}

export default Header;
