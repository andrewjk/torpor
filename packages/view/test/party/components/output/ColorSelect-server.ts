import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function ColorSelect(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		selectedColorId: 2
	});

	const colors = [
		{ id: 1, text: "red" },
		{ id: 2, text: "blue" },
		{ id: 3, text: "green" },
		{ id: 4, text: "gray", isDisabled: true },
	];

	/* User interface */
	let $output = "";
	$output += `<div> <div>Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}</div> <select value="${t_attr($state.selectedColorId) || ""}"> <![>`;
	for (let color of colors) {
		$output += `<!^> <option ${color.id ? `value="${t_attr(color.id)}"` : ''} ${color.isDisabled ? `disabled="${t_attr(color.isDisabled)}"` : ''}> ${t_fmt(color.text)} </option> `;
	}
	$output += `<!]><!> </select> </div>`;

	return $output;
}
