import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function BindText(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	t_body += ` <input value="${t_attr($state.name) || ""}"> <select value="${t_attr($state.selected) || ""}"> <option value="0">First</option> <option value="1">Second</option> <option value="2">Third</option> </select> <p>Hello, ${t_fmt($state.name)}</p> <p>You have selected, ${t_fmt($state.selected)}</p> `;

	return { body: t_body, head: t_head };
}
