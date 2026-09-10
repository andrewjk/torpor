import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function AdjacentIfsFor(
	$props: { a: boolean; b: boolean; c: boolean },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	if ($props.a) {
		t_body += `<!^><p>A</p>`;
	}
	t_body += `<!]><!> <![>`;
	if ($props.b) {
		t_body += `<!^><ul><![>`;
		for (let i = 0; i < 3; i++) {
			t_body += `<!^><li>B${t_fmt(i)}</li>`;
		}
		t_body += `<!]><!></ul>`;
	}
	t_body += `<!]><!> <![>`;
	if ($props.c) {
		t_body += `<!^><![>`;
		switch (1) {
			case 1: {
				t_body += `<!^><p>C-on</p>`;
				break;
			}
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
