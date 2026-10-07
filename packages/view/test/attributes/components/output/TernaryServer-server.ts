import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TernaryServer(
	$props: { on: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<button role="radio" ${($props.on ? 0 : -1) ? `tabindex="${t_attr($props.on ? 0 : -1)}"` : ""} ${($props.on ? "true" : "false") ? `aria-checked="${t_attr($props.on ? "true" : "false")}"` : ""} ${($props.on ? "active" : "inactive") ? `data-state="${t_attr($props.on ? "active" : "inactive")}"` : ""}>Hello</button>`;

	return { body: t_body, head: t_head };
}
