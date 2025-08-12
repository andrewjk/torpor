import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";

export default function Attributes(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <div ${$props.thing ? `thing="${t_attr($props.thing)}"` : ''} ${$props.dataThing ? `data-thing="${t_attr($props.dataThing)}"` : ''} caption="this attribute is for ${t_attr($props.description)}" attr="${t_attr($props.attr)}"> Hello! </div> `;

	return { body: t_body, head: t_head };
}
