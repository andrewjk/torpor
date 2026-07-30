import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function SwitchInFor(
	$props: { items: { name: string; type: string }[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li><![>`;
		switch (item.type) {
			case "admin": {
				t_body += `<!^><strong>${t_fmt(item.name)} (admin)</strong>`;
				break;
			}
			case "user": {
				t_body += `<!^><span>${t_fmt(item.name)} (user)</span>`;
				break;
			}
			default: {
				t_body += `<!^><em>${t_fmt(item.name)} (unknown)</em>`;
				break;
			}
		}
		t_body += `<!]><!></li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
