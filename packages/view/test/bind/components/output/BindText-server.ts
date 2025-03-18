import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function BindText(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	let $output = "";
	$output += `<div> <input value="${t_attr($state.name) || ""}"> <select value="${t_attr($state.selected) || ""}"> <option value="0">First</option> <option value="1">Second</option> <option value="2">Third</option> </select> <p>Hello, ${t_fmt($state.name)}</p> <p>You have selected, ${t_fmt($state.selected)}</p> </div>`;

	return $output;
}
