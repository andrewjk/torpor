import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function BatchTest(
	$props: { a: number; b: number; c: number },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p>A: ${t_fmt($props.a)}</p> <p>B: ${t_fmt($props.b)}</p> <p>C: ${t_fmt($props.c)}</p> <p>Sum: ${t_fmt($props.a + $props.b + $props.c)}</p>`;

	return { body: t_body, head: t_head };
}
