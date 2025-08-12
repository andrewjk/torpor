import $mount from "../../../../src/render/$serverMount";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";

export default function Mount(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let inputElement;

	$mount(() => {
		inputElement.value = "hi";
	});

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <input ref="${t_attr(inputElement) || ""}"> `;

	return { body: t_body, head: t_head };
}
