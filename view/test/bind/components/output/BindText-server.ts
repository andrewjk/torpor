import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function BindText(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ name: "Alice" });

	/* User interface */
	let $output = "";
	$output += `<div> <input value="${t_attr($state.name) || ""}"> <p>Hello, ${t_fmt($state.name)}</p> </div>`;

	return $output;
}
