import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SwitchString(
	$props: { status: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch ($props.status) {
		case "loading": {
			t_body += `<!^><p>Loading...</p>`;
			break;
		}
		case "success": {
			t_body += `<!^><p>Loaded!</p>`;
			break;
		}
		case "error": {
			t_body += `<!^><p>Error occurred</p>`;
			break;
		}
		default: {
			t_body += `<!^><p>Idle</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
