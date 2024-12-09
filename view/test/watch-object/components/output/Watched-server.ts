import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import { t_fmt } from "@tera/view/ssr";

export default function Watched(
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div> <p> ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.grandChild.grandChildText)} </p> </div>`;

	return $output;
}
