import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ForIn(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <section> <![>`;
	for (let key in $props.item) {
		t_body += `<!^> <p> ${t_fmt($props.item[key])} </p> `;
	}
	t_body += `<!]><!> </section> `;

	return { body: t_body, head: t_head };
}
