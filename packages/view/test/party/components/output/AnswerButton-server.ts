import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function AnswerButton(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <button>YES</button> <button>NO</button> `;

	return { body: t_body, head: t_head };
}
