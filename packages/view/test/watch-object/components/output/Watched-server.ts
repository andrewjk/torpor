import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Watched(
	$props: any,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p> ${t_fmt($props.text)} ${t_fmt($props.child.childText)} ${t_fmt($props.child.grandChild.grandChildText)} </p> `;

	return { body: t_body, head: t_head };
}
