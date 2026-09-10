import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AsyncFunctionTest(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<button id="btn">Click</button> <p>Status: idle</p>`;

	return { body: t_body, head: t_head };
}
