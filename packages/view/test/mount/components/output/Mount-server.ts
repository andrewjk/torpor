import $mount from "../../../../src/ssr/$serverMount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Mount(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let inputElement: HTMLInputElement;

	$mount(() => {
		inputElement.value = "hi";
	});

	/* User interface */
	t_body += ` <input> `;

	return { body: t_body, head: t_head };
}
