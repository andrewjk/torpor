import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function NestedReactive(
	$props: { user: { name: string; tags: string[] } },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>Name: ${t_fmt($props.user.name)}</p> <ul> <![>`;
	for (let tag of $props.user.tags) {
		t_body += `<!^> <li>${t_fmt(tag)}</li> `;
	}
	t_body += `<!]><!> </ul> <p>Tag count: ${t_fmt($props.user.tags.length)}</p> `;

	return { body: t_body, head: t_head };
}
