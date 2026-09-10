import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Head(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* Head */
	t_head += `<title>Hello</title> <meta name="description" content="A test">`;

	return { body: t_body, head: t_head };
}
