import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function NestedIf(
	$props: { condition: boolean, counter: number },
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.condition) {
		t_body += `<!^> <![>`;
		if ($props.counter > 5) {
			t_body += `<!^> <p>It's big</p> `;
		}
		else {
			t_body += `<!^> <p>It's small</p> `;
		}
		t_body += `<!]><!> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
