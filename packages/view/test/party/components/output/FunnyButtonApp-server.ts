import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

import FunnyButton from "../output/./FunnyButton-server";

export default function FunnyButtonApp(
	_$props:  Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;

	const t_comp_1 = FunnyButton(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		_$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `Click me!`;
		return t_body;
	}

	const t_comp_2 = FunnyButton(undefined, $context, t_slots_1);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
