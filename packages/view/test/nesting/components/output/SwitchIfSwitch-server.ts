import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function SwitchInsideIfInsideSwitch(
	$props: { level: string; kind: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch ($props.level) {
		case "top": {
			t_body += `<!^0><![>`;
			if ($props.kind === "a") {
				t_body += `<!^0><![>`;
				switch ($props.kind) {
					case "a": {
						t_body += `<!^0><p>Top A1</p>`;
						break;
					}
					default: {
						t_body += `<!^1><p>Top A-default</p>`;
						break;
					}
				}
				t_body += `<!]><!>`;
			}
			else {
				t_body += `<!^1><p>Top other</p>`;
			}
			t_body += `<!]><!>`;
			break;
		}
		case "bottom": {
			t_body += `<!^1><p>Bottom</p>`;
			break;
		}
		default: {
			t_body += `<!^2><p>Fallback</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
