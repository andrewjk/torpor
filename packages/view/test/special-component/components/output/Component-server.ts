import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

import BigTitle from "../output/./BigTitle-server";
import SmallTitle from "../output/./SmallTitle-server";

export default function Component(
	$props,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let components = {
		BigTitle,
		SmallTitle
	};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <![>`;
	components[$props.self];
	t_body += `<![>`;
	const t_props_1: any = {};
	t_props_1["self"] = components[$props.self];
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Hello! `;
		return t_body;
	}

	const t_comp_1 = components[$props.self](t_props_1, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
