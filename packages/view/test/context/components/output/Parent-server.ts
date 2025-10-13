import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

import ChildA from "../output/./ChildA-server";
import ChildB from "../output/./ChildB-server";

export default function Parent(
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	$context["ParentContext"] = "hi from the parent";

	/* User interface */
	t_body += ` <![>`;

	const t_comp_1 = ChildA(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <![>`;

	const t_comp_2 = ChildB(undefined, $context);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
