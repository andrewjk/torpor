import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Source(
	$props: { counter: number },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	let t_body = "";
	let t_head = "";

	const x = 5;

	/* User interface */
	t_body += ` <![>`;
	if ($props.counter > 10) {
		t_body += `<!^> <p> It's large. </p> `;
	}
	else {
		t_body += `<!^> <p> It's small. </p> `;
	}
	t_body += `<!]><!> `;
	const y = 10;
	return { body: t_body, head: t_head };
}
