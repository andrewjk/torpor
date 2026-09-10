import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Unused(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	const t_comp_1 = await Header(undefined, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}

async function Header(
	_$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<h2><![>`;
	if ($slots && $slots["_"]) {
		t_body += await $slots["_"](undefined, $context);
	} else {
		t_body += ` Default header... `;
	}
	t_body += `<!]><!></h2>`;

	return { body: t_body, head: t_head };
}
