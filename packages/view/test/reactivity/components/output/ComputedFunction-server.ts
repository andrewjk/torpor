import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ComputedGetter(
	$props: { count: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p>Count: ${t_fmt($props.count)}</p> <p>Doubled: ${t_fmt($props.count * 2)}</p> <p>Quadrupled: ${t_fmt($props.count * 4)}</p>`;

	return { body: t_body, head: t_head };
}
