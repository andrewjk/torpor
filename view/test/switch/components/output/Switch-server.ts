const Switch = {
	name: "Switch",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <![>`;
		switch ($props.value) {
			case 1: {
				$output += ` <p> A small value. </p> `;
				break;
			}
			case 100: {
				$output += ` <p> A large value. </p> `;
				break;
			}
			default: {
				$output += ` <p> Another value. </p> `;
				break;
			}
		}
		$output += `<!]><!> </div>`;
		return $output;
	}
}

export default Switch;
