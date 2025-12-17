import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Let(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	const t_props_1 = {
		items: $props.items,
	};
	const t_slots_1: Record<string, ServerSlotRender> = {};
	// @ts-ignore
	t_slots_1["_"] = (
		// @ts-ignore
		$slot: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` ${t_fmt($slot.item.text)} `;
		return t_body;
	}
	const t_comp_1 = List(t_props_1, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}

function List(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <ul> <![>`;
	for (let item of $props.items) {
		t_body += `<!^> <li> <![>`;
		const t_slot_props_1: any = {};
		t_slot_props_1["item"] = item;
		if ($slots && $slots["_"]) {
			t_body += $slots["_"](t_slot_props_1, $context);
		}
		t_body += `<!]><!> </li> `;
	}
	t_body += `<!]><!> </ul> `;

	return { body: t_body, head: t_head };
}
