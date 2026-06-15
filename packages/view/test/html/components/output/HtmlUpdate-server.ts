import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function HtmlUpdate(
	$props: { html: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div id="target"> <![>${$props.html}<!]><!> </div> `;

	return { body: t_body, head: t_head };
}
