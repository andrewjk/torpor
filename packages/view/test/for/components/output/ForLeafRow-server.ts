import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForLeafRow(
	$props: { items: Array<{ id: number, label: string }>, onSelect: (row: { id: number }) => void },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let row of $props.items) {
		t_body += `<!^>`;
		const suffix = "!";
		t_body += `<li><span class="label">${t_fmt(row.label)}${t_fmt(suffix)}</span> <button class="select">select</button></li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
