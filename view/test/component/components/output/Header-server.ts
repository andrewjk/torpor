const Header = {
	name: "Header",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<h2>Hi, ${t_fmt($props.name)}</h2>`;
		return $output;
	}
}

export default Header;
