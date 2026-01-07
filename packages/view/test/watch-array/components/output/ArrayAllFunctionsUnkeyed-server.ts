import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ArrayUnkeyed(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <p>^</p> <![>`;
	for (let item of $props.items) {
		t_body += `<!^> <p> ${t_fmt(item.text)} </p> `;
	}
	t_body += `<!]><!> <p>$</p> </section> `;

	return { body: t_body, head: t_head };
}
