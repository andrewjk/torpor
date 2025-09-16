import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function HelloWorld(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <h1>Hello world</h1> `;

	return { body: t_body, head: t_head };
}
