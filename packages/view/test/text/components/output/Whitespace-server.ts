import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function PreHydrate(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<pre>line1
line2
line3</pre>`;

	return { body: t_body, head: t_head };
}
