import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SeqIfsNested(
	$props: { a: boolean; b: boolean; c: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.a) {
		t_body += `<!^0><p>A on</p> <![>`;
		if ($props.b) {
			t_body += `<!^0><p>A+B on</p> <![>`;
			if ($props.c) {
				t_body += `<!^0><p>A+B+C on</p>`;
			}
			t_body += `<!]><!>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!> <![>`;
	if ($props.b) {
		t_body += `<!^0><p>B only section</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
