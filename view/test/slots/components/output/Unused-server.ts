import Header from './Header.tera';

const Unused = {
	name: "Unused",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");

		$output += Header.render(undefined, $context)
		return $output;
	}
}

export default Unused;
