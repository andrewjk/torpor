import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfFalse(
	$props: { counter: number },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.counter > 7) {
		t_body += `<!^> <p> It's true! </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
