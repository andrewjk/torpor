import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function OnMount(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <input> `;

	return { body: t_body, head: t_head };
}
