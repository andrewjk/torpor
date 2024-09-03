import FunnyButton from './FunnyButton.tera';

const FunnyButtonApp = {
	name: "FunnyButtonApp",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> `;

		$output += FunnyButton.render(undefined, $context)
		$output += ` `;
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += `Click me!`;
			return $output;
		}

		$output += FunnyButton.render(undefined, $context, t_slots_1)
		$output += ` </div>`;
		return $output;
	}
}

export default FunnyButtonApp;
