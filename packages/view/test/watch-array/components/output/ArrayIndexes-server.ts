import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ArrayIndexes(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <p>^</p> <![>`;
	for (let i = 0; i < $props.items.length; i++) {
		t_body += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt($props.items[i].text)} </span> `;
	}
	t_body += `<!]><!> <p>$</p> </section> `;

	return { body: t_body, head: t_head };
}
