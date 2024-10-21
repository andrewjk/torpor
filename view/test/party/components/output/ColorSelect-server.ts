import type { ServerSlotRender } from "@tera/view";

const ColorSelect = {
	/**
	 * The component's name.
	 */
	name: "ColorSelect",
	/**
	 * Renders the component into a HTML string.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($props?: any, $context?: Record<PropertyKey, any>, $slots?: Record<string, ServerSlotRender>) => {
		/* User script */
		const $watch = (obj: Record<PropertyKey, any>) => obj;
		let $state = $watch({
			selectedColorId: 2
		});

		const colors = [
			{ id: 1, text: "red" },
			{ id: 2, text: "blue" },
			{ id: 3, text: "green" },
			{ id: 4, text: "gray", isDisabled: true },
		];
		let $output = "";
		/* User interface */
		const t_fmt = (text: string) => (text != null ? text : "");
		$output += `<div> <div>Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}</div> <select value="${$state.selectedColorId || ""}"> <![>`;
		for (let color of colors) {
			$output += `<!^> <option ${color.id ? `value="${color.id}"` : ''} ${color.isDisabled ? `disabled="${color.isDisabled}"` : ''}> ${t_fmt(color.text)} </option> `;
		}
		$output += `<!]><!> </select> </div>`;
		return $output;
	}
}

export default ColorSelect;
