import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Probe(
	$props: { items: { name: string }[] },
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	for (let item of $props.items) {
		t_body += `<!^><![>`;
		const t_props_1 = {
			label: item.name,
			value: item.name,
		};
		const t_comp_1 = await Child(t_props_1, $context);
		t_body += t_comp_1.body;
		t_head += t_comp_1.head;
		t_body += `<!]><!>`;
		const x = item.name;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
