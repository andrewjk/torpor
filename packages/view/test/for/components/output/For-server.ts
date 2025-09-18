import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function For(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <![>`;
	for (let i = 0; i < 5; i++) {
		t_body += `<!^> <p> ${t_fmt(i)} </p> `;
	}
	t_body += `<!]><!> </section> `;

	return { body: t_body, head: t_head };
}
