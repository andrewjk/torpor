import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForSwitchReactive(
	$props: { items: Array<{ id: number, status: string }> },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><![>`;
		switch (item.status) {
			case "on": {
				t_body += `<!^><li class="on">${t_fmt(item.id)}</li>`;
				break;
			}
			case "off": {
				t_body += `<!^><li class="off">${t_fmt(item.id)}</li>`;
				break;
			}
			default: {
				t_body += `<!^><li class="unknown">${t_fmt(item.id)}</li>`;
				break;
			}
		}
		t_body += `<!]><!>`;
	}
	t_body += `<!]><!></ul> <footer>after</footer>`;

	return { body: t_body, head: t_head };
}
