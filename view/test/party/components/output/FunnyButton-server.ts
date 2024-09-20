import type SlotRender from "@tera/view";

const FunnyButton = {
	/**
	 * The component's name.
	 */
	name: "FunnyButton",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: any, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<button style="
		background: rgba(0, 0, 0, 0.4);
		color: #fff;
		padding: 10px 20px;
		font-size: 30px;
		border: 2px solid #fff;
		margin: 8px; transform: scale(0.9);
		box-shadow: 4px 4px rgba(0, 0, 0, 0.4);
		transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s;
		outline: 0;
		"> <![>`;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](undefined, $context);
		} else {
			$output += ` <span>No content found</span> `;
		}
		$output += `<!]><!> </button>`;
		return $output;
	}
}

export default FunnyButton;
