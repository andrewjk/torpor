import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

/**
 * A component with some text in it.
 */
export default function Text(
	$props: {
		value: string;
		empty: string;
	},
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <p> ${t_fmt($props.value)} </p>  <p>${t_fmt($props.empty)}</p> `;

	return $output;
}
