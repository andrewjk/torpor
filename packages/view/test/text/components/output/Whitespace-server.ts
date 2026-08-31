import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MultiText(
	$props: { a: string, b: string },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<p> ${t_fmt($props.a)} and ${t_fmt($props.b)} </p>`;

	return { body: t_body, head: t_head };
}
