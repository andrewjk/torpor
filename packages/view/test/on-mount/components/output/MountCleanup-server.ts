import $onmount from "../../../../src/ssr/$serverOnmount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MultiMount(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	$onmount(() => {
		window.__mountLog.push("first")
	})
	$onmount(() => {
		window.__mountLog.push("second")
	})
	$onmount(() => {
		window.__mountLog.push("third")
	})

	/* User interface */
	t_body += `<p>Multi</p>`;

	return { body: t_body, head: t_head };
}
