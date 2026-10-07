import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForWrite(
	$props: { rows: Props["rows"] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let row of $props.rows) {
		t_body += `<!^><li ${(row.label) ? `data-testid="${t_attr(row.label)}"` : ""}><input type="checkbox" checked="${(row.done) || false}"> ${t_fmt(row.done ? "done" : "todo")}:${t_fmt(row.label)} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
