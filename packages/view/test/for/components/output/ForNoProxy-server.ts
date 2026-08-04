import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForNoProxy(
	$props: { items: Array<{ id: number, label: string }> },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let row of $props.items) {
		t_body += `<!^><li>${t_fmt(row.label)}</li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
