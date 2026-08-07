import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForNested(
	$props: { matrix: number[][] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<table><![>`;
	for (let row of $props.matrix) {
		t_body += `<!^><tr><![>`;
		for (let cell of row) {
			t_body += `<!^><td>${t_fmt(cell)}</td>`;
		}
		t_body += `<!]><!></tr>`;
	}
	t_body += `<!]><!></table>`;

	return { body: t_body, head: t_head };
}
