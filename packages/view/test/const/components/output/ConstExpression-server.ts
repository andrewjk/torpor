import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ConstExpression(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	const x = 2 + 3;
	const greeting = "Hello, " + "World";
	const isEven = 4 % 2 === 0;
	t_body += `<p>x = ${t_fmt(x)}</p> <p>greeting = ${t_fmt(greeting)}</p> <p>isEven = ${t_fmt(isEven)}</p>`;

	return { body: t_body, head: t_head };
}
