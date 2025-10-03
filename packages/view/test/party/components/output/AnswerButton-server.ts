import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function AnswerButton(
	$props: any,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <button>YES</button> <button>NO</button> `;

	return { body: t_body, head: t_head };
}
