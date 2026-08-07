import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForObjectProps(
	$props: { items: { id: number; name: string; active: boolean }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li><span>${t_fmt(item.name)}</span> <![>`;
		if (item.active) {
			t_body += `<!^><strong>*</strong>`;
		}
		t_body += `<!]><!></li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
