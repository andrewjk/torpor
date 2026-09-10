import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function DeepNesting(
	$props: { level: number; on: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.level >= 1) {
		t_body += `<!^><p>L1</p> <![>`;
		if ($props.level >= 2) {
			t_body += `<!^><p>L2</p> <![>`;
			if ($props.level >= 3) {
				t_body += `<!^><p>L3</p> <![>`;
				if ($props.level >= 4) {
					t_body += `<!^><p>L4</p>`;
				}
				t_body += `<!]><!>`;
			}
			t_body += `<!]><!>`;
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!> <![>`;
	if ($props.on) {
		t_body += `<!^><p>On flag</p>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
