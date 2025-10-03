import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

import Header from "../output/./Header-server";

export default function Component(
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	const t_props_1: any = {};
	t_props_1["name"] = "Amy";

	const t_comp_1 = Header(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
