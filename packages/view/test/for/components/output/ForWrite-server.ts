import t_attr from "../../../../src/render/formatAttributeText";
import t_attr_if from "../../../../src/ssr/buildAttribute";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForWrite(
	$props: { rows: { name: string; ok: boolean; tags: { ok: boolean }[] }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let row of $props.rows) {
		t_body += `<!^><li ${t_attr_if("data-testid", row.label)}><input type="checkbox" checked="${t_attr(row.done) || false}"> ${t_fmt(row.done ? "done" : "todo")}:${t_fmt(row.label)} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
