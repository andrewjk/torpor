import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TextareaValue(
	$props: { value: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<textarea ${($props.value) ? `value="${t_attr($props.value)}"` : ""}></textarea>`;

	return { body: t_body, head: t_head };
}
