import $watch from "../../../../src/ssr/$serverWatch";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForComment(
	$props: { items: string[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ selected: "" })

	/* User interface */
	t_body += `<ul><![>`;
	for (let [index, item] of $props.items.entries()) {
		t_body += `<!^><li><button ${item ? `data-testid="${t_attr(item)}"` : ""} ${$state.selected === item ? "" : undefined ? `data-selected="${t_attr($state.selected === item ? "" : undefined)}"` : ""}> ${t_fmt(index)}: ${t_fmt(item)} </button></li>`;
	}
	t_body += `<!]><!></ul>`;

	return { body: t_body, head: t_head };
}
