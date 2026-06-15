import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function TextInterpolation(
	$props: { name: string; count: number; active: boolean },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <p>Hello, ${t_fmt($props.name)}!</p> <p>Count: ${t_fmt($props.count)}</p> <p>Active: ${t_fmt($props.active)}</p> `;

	return { body: t_body, head: t_head };
}
