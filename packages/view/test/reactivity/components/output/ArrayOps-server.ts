import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ReactiveNewProp(
	$props: { items: string[]; newItem: string },
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
	t_body += `<!]><!></ul> <p>Count: ${t_fmt($props.items.length)}</p> <p>First: ${t_fmt($props.items[0])}</p> <p>Last: ${t_fmt($props.items[$props.items.length - 1])}</p> <p>New: ${t_fmt($props.newItem)}</p>`;

	return { body: t_body, head: t_head };
}
