import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Html(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p> <![>${$props.html}<!]><!> </p> `;

	return { body: t_body, head: t_head };
}
