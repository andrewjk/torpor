import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SwitchString(
	$props: { status: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch ($props.status) {
		case "loading": {
			t_body += `<!^0><p>Loading...</p>`;
			break;
		}
		case "success": {
			t_body += `<!^1><p>Loaded!</p>`;
			break;
		}
		case "error": {
			t_body += `<!^2><p>Error occurred</p>`;
			break;
		}
		default: {
			t_body += `<!^3><p>Idle</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
