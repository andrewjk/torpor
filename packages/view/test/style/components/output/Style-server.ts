import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_style from "../../../../src/render/buildStyles";

export default function Style(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div ${t_style({ color: $props.color }) !== "" ? `style="${t_style({ color: $props.color })}"` : ""}> Hello! </div> `;

	return { body: t_body, head: t_head };
}
