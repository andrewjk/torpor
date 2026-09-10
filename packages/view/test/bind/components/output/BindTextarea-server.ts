import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function BindTextarea(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ message: "Initial text" });

	/* User interface */
	t_body += `<textarea value="${t_attr($state.message) || ""}"></textarea> <p>Preview: ${t_fmt($state.message)}</p>`;

	return { body: t_body, head: t_head };
}
