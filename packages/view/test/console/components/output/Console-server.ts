import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Console(
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div>  </div> `;

	return { body: t_body, head: t_head };
}
