import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import Header from "../output/./Header-server"

export default function Unused(
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
	t_body += ` <![>`;

	const t_comp_1 = Header(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
