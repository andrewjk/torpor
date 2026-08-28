import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForOptionalChaining(
	$props: {
		items: { name: string; hasChildren?: boolean }[]
	},
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li ${item?.name ? `data-testid="${t_attr(item?.name)}"` : ""} ${item?.hasChildren === true ? "" : undefined ? `data-selected="${t_attr(item?.hasChildren === true ? "" : undefined)}"` : ""} ${"x" ?? item?.name ? `data-fallback="${t_attr("x" ?? item?.name)}"` : ""}> ${t_fmt(item?.name)} </li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
