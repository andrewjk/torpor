import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";

export default function Attributes(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div ${$props.thing ? `thing="${t_attr($props.thing)}"` : ''} ${$props.dataThing ? `data-thing="${t_attr($props.dataThing)}"` : ''} caption="this attribute is for ${t_attr($props.description)}"> Hello! </div>`;

	return $output;
}
