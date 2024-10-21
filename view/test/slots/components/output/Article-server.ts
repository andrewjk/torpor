import type { SlotRender } from "@tera/view";

const Article = {
	/**
	 * The component's name.
	 */
	name: "Article",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<section> <h2> <![>`;
		if ($slots && $slots["header"]) {
			$output += $slots["header"](undefined, $context);
		}
		$output += `<!]><!> </h2> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		}
		$output += `<!]><!> <![>`;
		if ($slots && $slots["footer"]) {
			$output += $slots["footer"](undefined, $context);
		}
		$output += `<!]><!> </section>`;
		return $output;
	}
}

export default Article;
