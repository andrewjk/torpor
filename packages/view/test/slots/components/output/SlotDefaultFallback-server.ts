import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SlotDefault(
	$props: { items: string[] },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		_$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		// eslint-disable-next-line no-unused-vars
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `<p>Default content</p>`;
		return t_body;
	}
	const t_comp_1 = List(undefined, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <![>`;
	const t_props_1 = {
		items: $props.items,
	};
	const t_comp_2 = ListWithItems(t_props_1, $context);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

function List(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	} else {
		t_body += `<li>Empty list</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}

function ListWithItems(
	$props: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li>${t_fmt(item)}</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
