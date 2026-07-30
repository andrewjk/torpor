import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfNested(
	$props: { a: boolean; b: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.a) {
		t_body += `<!^><p>A is true</p> <![>`;
		if ($props.b) {
			t_body += `<!^><p>B is true</p>`;
		}
		else {
			t_body += `<!^><p>B is false</p>`;
		}
		t_body += `<!]><!>`;
	}
	else {
		t_body += `<!^><p>A is false</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
