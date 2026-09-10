import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function IfInSwitch(
	$props: { show: boolean; status: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch ($props.status) {
		case "active": {
			t_body += `<!^><![>`;
			if ($props.show) {
				t_body += `<!^><p>Active and visible</p>`;
			}
			else {
				t_body += `<!^><p>Active but hidden</p>`;
			}
			t_body += `<!]><!>`;
			break;
		}
		case "inactive": {
			t_body += `<!^><p>Inactive</p>`;
			break;
		}
		default: {
			t_body += `<!^><p>Unknown status</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
