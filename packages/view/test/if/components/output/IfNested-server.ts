import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfNested(
	$props: { counter: number },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
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
