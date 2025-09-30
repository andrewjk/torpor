import $mount from "../../../../src/render/$serverMount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";

export default function Mount(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	let inputElement;

	$mount(() => {
		inputElement.value = "hi";
	});

	/* User interface */
	t_body += ` <input ref="${t_attr(inputElement) || ""}"> `;

	return { body: t_body, head: t_head };
}
