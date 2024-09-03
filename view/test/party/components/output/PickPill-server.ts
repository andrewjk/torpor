const PickPill = {
	name: "PickPill",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		let $state = $watch({
			picked: "red"
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<div> <div>Picked: ${t_fmt($state.picked)}</div> <input id="blue-pill" group="${$state.picked || ""}" type="radio" value="blue"/> <label for="blue-pill">Blue pill</label> <input id="red-pill" group="${$state.picked || ""}" type="radio" value="red"/> <label for="red-pill">Red pill</label> </div>`;
		return $output;
	}
}

export default PickPill;
