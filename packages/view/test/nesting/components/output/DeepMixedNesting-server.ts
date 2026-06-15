import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function DeepMixed(
	$props: { a: boolean; b: boolean; c: boolean; d: boolean; e: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.a) {
		t_body += `<!^> <p>Level 1</p> <![>`;
		if ($props.b) {
			t_body += `<!^> <p>Level 2</p> <![>`;
			if ($props.c) {
				t_body += `<!^> <p>Level 3</p> <![>`;
				if ($props.d) {
					t_body += `<!^> <p>Level 4</p> <![>`;
					if ($props.e) {
						t_body += `<!^> <p>Level 5</p> `;
					}
					t_body += `<!]><!> `;
				}
				t_body += `<!]><!> `;
			}
			t_body += `<!]><!> `;
		}
		t_body += `<!]><!> `;
	}
	t_body += `<!]><!> <![>`;
	if ($props.a && $props.e) {
		t_body += `<!^> <p>A+E</p> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
