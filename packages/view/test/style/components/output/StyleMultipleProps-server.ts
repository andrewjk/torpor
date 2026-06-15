import t_style from "../../../../src/render/buildStyles";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function StyleMultiple(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div id="multi" ${t_style({ color: $props.color, fontSize: $props.fontSize + "px", background: $props.background }) !== "" ? `style="${t_style({ color: $props.color, fontSize: $props.fontSize + "px", background: $props.background })}"` : ""}> Multi style </div> `;

	return { body: t_body, head: t_head };
}
