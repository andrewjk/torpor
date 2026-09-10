import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SeqIfs(
	$props: { a: boolean; b: boolean; c: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.a) {
		t_body += `<!^><p>A on</p>`;
	}
	t_body += `<!]><!> <![>`;
	if ($props.b) {
		t_body += `<!^><p>B on</p>`;
	}
	t_body += `<!]><!> <![>`;
	if ($props.c) {
		t_body += `<!^><p>C on</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
