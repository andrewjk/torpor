import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfElseIf(
	$props: { count: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.count < 0) {
		t_body += `<!^><p>Negative</p>`;
	}
	else if ($props.count === 0) {
		t_body += `<!^><p>Zero</p>`;
	}
	else if ($props.count < 10) {
		t_body += `<!^><p>Small positive</p>`;
	}
	else {
		t_body += `<!^><p>Large positive</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
