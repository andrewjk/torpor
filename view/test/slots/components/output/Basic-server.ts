import Header from './Header.tera';

const Basic = {
	name: "Basic",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += ` Basic stuff `;
			return $output;
		}

		$output += Header.render(undefined, $context, t_slots_1)
		return $output;
	}
}

export default Basic;
