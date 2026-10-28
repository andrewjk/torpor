import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SwitchExpr(
	$props: { score: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch (Math.floor($props.score / 10)) {
		case 0: {
			t_body += `<!^0><p>F</p>`;
			break;
		}
		case 1: {
			t_body += `<!^1><p>D</p>`;
			break;
		}
		case 2: {
			t_body += `<!^2><p>C</p>`;
			break;
		}
		case 3: {
			t_body += `<!^3><p>B</p>`;
			break;
		}
		default: {
			t_body += `<!^4><p>A</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
