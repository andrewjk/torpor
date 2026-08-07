import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForInSwitch(
	$props: { choice: string; items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<![>`;
	switch ($props.choice) {
		case "list": {
			t_body += `<!^><ul><![>`;
			for (let item of $props.items) {
				t_body += `<!^><li>${t_fmt(item)}</li>`;
			}
			t_body += `<!]><!></ul>`;
			break;
		}
		case "count": {
			t_body += `<!^><p>Count: ${t_fmt($props.items.length)}</p>`;
			break;
		}
		default: {
			t_body += `<!^><p>Nothing</p>`;
			break;
		}
	}
	t_body += `<!]><!>`;

	return { body: t_body, head: t_head };
}
