import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfCache(
	$props: { counter: number, i: number },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.counter < 5) {
		t_body += `<!^> <p> It's small! </p> `;
	}
	else {
		t_body += `<!^> <p> It's not small... </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
