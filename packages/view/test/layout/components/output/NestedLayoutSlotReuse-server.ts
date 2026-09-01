import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function BindingsPage(
	$props: any,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<h1>Bindings</h1> <p>Bindings page count ${t_fmt($props.count)}</p>`;

	return { body: t_body, head: t_head };
}
