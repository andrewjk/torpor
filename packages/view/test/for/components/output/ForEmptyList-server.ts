import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ForEmpty(
	$props: { items: string[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<ul><![>`;
	for (let item of $props.items) {
		t_body += `<!^><li>${t_fmt(item)}</li>`;
	}
	t_body += `<!]><!></ul> <p class="count">Count: ${t_fmt($props.items.length)}</p>`;

	return { body: t_body, head: t_head };
}
