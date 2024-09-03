const PageTitle = {
	name: "PageTitle",
	/**
	 * @param {Object} [$props]
	 * @param {Object} [$context]
	 * @param {Object} [$slots]
	 */
	render: ($props, $context, $slots) => {
		/* User script */
		const $watch = (obj) => obj;
		const $run = (fn) => null;
		let $state = $watch({
			pageTitle: ""
		});
		$run(() => {
			$state.pageTitle = document.title;
		});
		let $output = "";
		/* User interface */
		const t_fmt = (text) => text != null ? text : "";
		$output += `<p>Page title: ${t_fmt($state.pageTitle)}</p>`;
		return $output;
	}
}

export default PageTitle;
