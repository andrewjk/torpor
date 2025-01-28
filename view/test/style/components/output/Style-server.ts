import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_style from "../../../../src/render/getStyles";

export default function Style(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div style="${t_style({ color: $props.color })}"> Hello! </div>`;

	return $output;
}
