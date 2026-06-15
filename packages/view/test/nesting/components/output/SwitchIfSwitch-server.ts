import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SwitchInsideIfInsideSwitch(
	$props: { level: string; kind: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	switch ($props.level) {
		case "top": {
			t_body += `<!^> <![>`;
			if ($props.kind === "a") {
				t_body += `<!^> <![>`;
				switch ($props.kind) {
					case "a": {
						t_body += `<!^> <p>Top A1</p> `;
						break;
					}
					default: {
						t_body += `<!^> <p>Top A-default</p> `;
						break;
					}
				}
				t_body += `<!]><!> `;
			}
			else {
				t_body += `<!^> <p>Top other</p> `;
			}
			t_body += `<!]><!> `;
			break;
		}
		case "bottom": {
			t_body += `<!^> <p>Bottom</p> `;
			break;
		}
		default: {
			t_body += `<!^> <p>Fallback</p> `;
			break;
		}
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
