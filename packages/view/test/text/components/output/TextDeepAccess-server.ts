import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function DeepAccess(
	$props: { user: { profile: { name: string; address: { city: string } } } },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>Name: ${t_fmt($props.user.profile.name)}</p> <p>City: ${t_fmt($props.user.profile.address.city)}</p> `;

	return { body: t_body, head: t_head };
}
