import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForRegex(
	$props: { items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li ${item ? `data-testid="${t_attr(item)}"` : ""} ${/^a/.test(item) ? "" : undefined ? `data-starts-a="${t_attr(/^a/.test(item) ? "" : undefined)}"` : ""} ${item.replace(/\b[a-z]/g, (c) => c.toUpperCase()) ? `data-label="${t_attr(item.replace(/\b[a-z]/g, (c) => c.toUpperCase()))}"` : ""}> ${t_fmt(item.replace(/\d+/g, ""))} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
