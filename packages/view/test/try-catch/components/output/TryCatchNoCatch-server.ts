import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function TryNoCatch(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	t_body += `<p>Fine</p>`;
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
