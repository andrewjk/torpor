import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function App(
	$props: { items: string[] },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = async (
		_$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		// eslint-disable-next-line no-unused-vars
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += `<![>`;
		if ($props.items.length === 0) {
			t_body += `<!^0><p class="empty">Empty</p>`;
		}
		t_body += `<!]><!> <![>`;
		for (let item of $props.items) {
			t_body += `<!^><li>${t_fmt(item)}</li>`;
		}
		t_body += `<!]><!>`;
		return t_body;
	}
	const t_comp_1 = await Wrapper(undefined, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

async function Wrapper(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div class="wrapper"><![>`;
	if ($slots && $slots["_"]) {
		t_body += await $slots["_"](undefined, $context);
	}
	t_body += `<!]><!> <p class="after">After</p></div>`;

	return { body: t_body, head: t_head };
}
