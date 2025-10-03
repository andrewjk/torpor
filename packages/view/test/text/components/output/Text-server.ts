import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

/**
 * A component with some text in it.
 */
export default function Text(
	$props: {
		value: string;
		empty: string;
	},
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p> ${t_fmt($props.value)} </p>  <p>${t_fmt($props.empty)}</p> `;

	return { body: t_body, head: t_head };
}
