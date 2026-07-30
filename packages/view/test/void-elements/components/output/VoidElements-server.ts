import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function VoidElements(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<div><input type="text" placeholder="type here"> <br> <hr> <img src="test.jpg" alt="test"> <p>After void elements</p></div>`;

	return { body: t_body, head: t_head };
}
