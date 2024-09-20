import type SlotRender from "@tera/view";

const PageTitle = {
	/**
	 * The component's name.
	 */
	name: "PageTitle",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
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
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<p>Page title: ${t_fmt($state.pageTitle)}</p>`;
		return $output;
	}
}

export default PageTitle;
