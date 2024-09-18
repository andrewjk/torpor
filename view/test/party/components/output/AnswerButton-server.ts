const AnswerButton = {
	name: "AnswerButton",
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
		$output += `<div> <button> YES </button> <button> NO </button> </div>`;
		return $output;
	}
}

export default AnswerButton;
