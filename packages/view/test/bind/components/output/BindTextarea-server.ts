import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function BindTextarea(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ message: "Initial text" });

	/* User interface */
	t_body += ` <textarea value="${t_attr($state.message) || ""}"></textarea> <p>Preview: ${t_fmt($state.message)}</p> `;

	return { body: t_body, head: t_head };
}
