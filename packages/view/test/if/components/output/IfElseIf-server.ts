import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfElseIf(
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
	if ($props.counter > 10) {
		t_body += `<!^> <p> It's over ten! </p> `;
	}
	else if ($props.counter > 5) {
		t_body += `<!^> <p> It's over five! </p> `;
	}
	else {
		t_body += `<!^> <p> It's not there yet </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
