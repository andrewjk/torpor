import t_style from "../../../../src/render/buildStyles";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function StyleToggle(
	$props: { active: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div ${t_style({ color: $props.active ? "green" : "red" }) !== "" ? `style="${t_style({ color: $props.active ? "green" : "red" })}"` : ""}> Toggle style </div>`;

	return { body: t_body, head: t_head };
}
