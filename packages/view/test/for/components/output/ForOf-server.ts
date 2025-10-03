import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ForOf(
	$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <![>`;
	for (let item of $props.items) {
		t_body += `<!^> <p> ${t_fmt(item)} </p> `;
	}
	t_body += `<!]><!> </section> `;

	return { body: t_body, head: t_head };
}
