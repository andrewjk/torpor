import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SwitchExpr(
	$props: { score: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch (Math.floor($props.score / 10)) {
		case 0: {
			t_body += `<!^><p>F</p>`;
			break;
		}
		case 1: {
			t_body += `<!^><p>D</p>`;
			break;
		}
		case 2: {
			t_body += `<!^><p>C</p>`;
			break;
		}
		case 3: {
			t_body += `<!^><p>B</p>`;
			break;
		}
		default: {
			t_body += `<!^><p>A</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
