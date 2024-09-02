import Article from './Article.tera';

const Named = {
	name: "Named",
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
			$output += `  <p> The article's body </p> `;
			return $output;
		}
		t_slots_1["header"] = ($sprops) => {
			let $output = "";
			$output += ` The article's header `;
			return $output;
		}
		$output += Article.render(undefined, t_slots_1, $context)
		return $output;
	}
}

export default Named;
