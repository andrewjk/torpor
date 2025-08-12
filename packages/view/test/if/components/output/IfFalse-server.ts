import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfFalse(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <![>`;
	if ($props.counter > 7) {
		t_body += `<!^> <p> It's true! </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
