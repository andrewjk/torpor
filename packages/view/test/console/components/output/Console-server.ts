import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Console(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div>  </div> `;

	return { body: t_body, head: t_head };
}
