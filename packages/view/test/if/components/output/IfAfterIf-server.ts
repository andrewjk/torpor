import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfAfterIf(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.counter > 10) {
		t_body += `<!^> <p> It's true! </p> `;
	}
	t_body += `<!]><!> <![>`;
	if ($props.counter > 5) {
		t_body += `<!^> <p> It's also true! </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
