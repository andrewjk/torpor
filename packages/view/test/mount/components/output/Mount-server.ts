import $onmount from "../../../../src/ssr/$serverOnmount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function Mount(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let inputElement: HTMLInputElement;

	$onmount(() => {
		inputElement.value = "hi";
	});

	/* User interface */
	t_body += `<input>`;

	return { body: t_body, head: t_head };
}
