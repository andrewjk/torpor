import Article from './Article.tera';

const Named = {
	name: "Named",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		const t_slots_1 = {};
		t_slots_1["_"] = ($sprops, $context) => {
			let $output = "";
			$output += `  <p> The article's body </p> `;
			return $output;
		}
		t_slots_1["header"] = ($sprops, $context) => {
			let $output = "";
			$output += ` The article's header `;
			return $output;
		}

		$output += Article.render(undefined, $context, t_slots_1)
		return $output;
	}
}

export default Named;
