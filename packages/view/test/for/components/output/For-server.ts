import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function For(
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
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
