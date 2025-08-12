import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Console(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <div>  </div> `;

	return { body: t_body, head: t_head };
}
