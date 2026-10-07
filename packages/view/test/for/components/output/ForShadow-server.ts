import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForShadow(
	$props: { rows: Props["rows"] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let row of $props.rows) {
		t_body += `<!^><li ${(row.name) ? `data-testid="${t_attr(row.name)}"` : ""}> ${t_fmt(row.ok&&"Y"||"N")}:${t_fmt(row.name)}:${t_fmt(row.tags.filter(row=>row.ok).length)} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
