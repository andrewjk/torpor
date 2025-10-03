import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_style from "../../../../src/render/buildStyles";

export default function Style(
	$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div style="${t_style({ color: $props.color })}"> Hello! </div> `;

	return { body: t_body, head: t_head };
}
