import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Const(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	const name = "Boris";
	t_body += `<p> Hello, ${t_fmt(name)}! </p>`;

	return { body: t_body, head: t_head };
}
