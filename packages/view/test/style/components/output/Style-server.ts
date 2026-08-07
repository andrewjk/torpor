import t_style from "../../../../src/render/buildStyles";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Style(
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_style({ color: $props.color }) !== "" ? `style="${t_style({ color: $props.color })}"` : ""}> Hello! </div>`;

	return { body: t_body, head: t_head };
}
