import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Element(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <${$props.tag}> Hello! </${$props.tag}> `;

	return { body: t_body, head: t_head };
}
