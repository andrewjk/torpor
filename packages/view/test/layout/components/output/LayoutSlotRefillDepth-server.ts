import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Page(
	$props: any,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<h1>Page two</h1>`;

	return { body: t_body, head: t_head };
}
