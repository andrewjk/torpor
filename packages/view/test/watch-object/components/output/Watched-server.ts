import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Watched(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <div> <p> ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.grandChild.grandChildText)} </p> </div> `;

	return $output;
}
