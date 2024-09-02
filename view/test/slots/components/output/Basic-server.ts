import Header from './Header.tera';

const Basic = {
	name: "Basic",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$slots]
	 * @param {Object} [$context]
	 */
	render: ($props, $slots, $context) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops) => {
			let $output = "";
			$output += ` Basic stuff `;
			return $output;
		}
		$output += Header.render(undefined, t_slots_1, $context)
		return $output;
	}
}

export default Basic;
