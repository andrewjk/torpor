import type SlotRender from "@tera/view";

const AnswerButton = {
	/**
	 * The component's name.
	 */
	name: "AnswerButton",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props: {
		onYes: Function;
		onNo: Function;
	}, $context: Record<PropertyKey, any>, $slots: Record<string, SlotRender>) => {
		$props ||= {};

		let $output = "";
		/* User interface */
		const t_fmt = (text) => (text != null ? text : "");
		$output += `<div> <button>YES</button> <button>NO</button> </div>`;
		return $output;
	}
}

export default AnswerButton;
