import t_class from "../../../../src/render/buildClasses";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ClassToggle(
	$props: { active: boolean; emphasis: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p ${t_class({ active: $props.active, emphasis: $props.emphasis, base: true }) !== "" ? `class="${t_class({ active: $props.active, emphasis: $props.emphasis, base: true })}"` : ""}> Toggle class </p> `;

	return { body: t_body, head: t_head };
}
