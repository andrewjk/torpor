import t_fmt from "../../../../src/ssr/formatText";
import { renderContext as t_render_context } from "../../../../src/ssr/renderContext";
import t_slot_guard from "../../../../src/ssr/slotGuard";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Let(
	$props: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	$context = t_render_context($context);
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_props_1 = {
		items: $props.items,
	};
	const t_slots_1: Record<string, ServerSlotRender> = {};
	// @ts-ignore
	t_slots_1["_"] = async (
		$slot: Record<PropertyKey, any>,
		_$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` ${t_fmt($slot.item.text)} `;
		return t_body;
	}
	const t_comp_1 = await List(t_props_1, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

async function List(
	$props: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	$context = t_render_context($context);
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li><![>`;
		const t_slot_props_1: any = {};
		t_slot_props_1["item"] = item;
		if ($slots && $slots["_"]) {
			t_body += t_slot_guard(["li"], await $slots["_"](t_slot_props_1, $context), "_");
		}
		t_body += `<!]><!></li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
