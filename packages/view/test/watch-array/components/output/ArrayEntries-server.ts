import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ArrayEntries(
	$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <p>^</p> <![>`;
	for (let [i, item] of $props.items.entries()) {
		t_body += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt(item.text)} </span> `;
	}
	t_body += `<!]><!> <p>$</p> </section> `;

	return { body: t_body, head: t_head };
}
