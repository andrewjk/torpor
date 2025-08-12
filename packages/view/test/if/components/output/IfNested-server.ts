import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfNested(
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
	if ($props.counter > 5) {
		t_body += `<!^> <![>`;
		if ($props.counter > 10) {
			t_body += `<!^> <p> It's both true! </p> `;
		}
		else {
			t_body += `<!^> <p> The second is not true! </p> `;
		}
		t_body += `<!]><!> `;
	}
	else {
		t_body += `<!^> <p> The first is not true! </p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
