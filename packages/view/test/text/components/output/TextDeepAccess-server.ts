import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function DeepAccess(
	$props: { user: { profile: { name: string; address: { city: string } } } },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p>Name: ${t_fmt($props.user.profile.name)}</p> <p>City: ${t_fmt($props.user.profile.address.city)}</p>`;

	return { body: t_body, head: t_head };
}
