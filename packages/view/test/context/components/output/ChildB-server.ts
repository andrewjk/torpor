import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function ChildB(
	_$props:  Record<PropertyKey, any> | undefined,
	$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	$context = Object.assign({}, $context);
	let t_body = "";
	let t_head = "";

	$context["ChildBContext"] = "hi!";

	/* User interface */
	t_body += ` <p>Nothing to see here...</p> `;

	return { body: t_body, head: t_head };
}
