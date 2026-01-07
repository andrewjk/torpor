import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfElse(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.counter > 7) {
		t_body += `<!^> <p> It's true! </p> <p> That's right </p> `;
	}
	else {
		t_body += `<!^> <p> It's not true... </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
