import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function NewlineText(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <pre>line1
line2
line3</pre> `;

	return { body: t_body, head: t_head };
}
