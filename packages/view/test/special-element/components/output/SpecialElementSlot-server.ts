import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Element(
	$props: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_props_1 = {
		tag: $props.tag,
	};
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = async (
		_$slot?: Record<PropertyKey, any>,
		// @ts-ignore
		// eslint-disable-next-line no-unused-vars
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Hello! `;
		return t_body;
	}
	const t_comp_1 = await Child(t_props_1, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

async function Child(
	$props: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<${$props.tag}><![>`;
	if ($slots && $slots["_"]) {
		t_body += await $slots["_"](undefined, $context);
	}
	t_body += `<!]><!></${$props.tag}>`;

	return { body: t_body, head: t_head };
}
