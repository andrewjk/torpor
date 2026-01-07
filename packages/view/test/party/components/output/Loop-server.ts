import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Colors(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	const colors = ["red", "green", "blue"];

	/* User interface */
	t_body += ` <ul> <![>`;
	for (let color of colors) {
		t_body += `<!^>  <li>${t_fmt(color)}</li> `;
	}
	t_body += `<!]><!> </ul> `;

	return { body: t_body, head: t_head };
}
