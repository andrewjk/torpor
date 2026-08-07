import $mount from "../../../../src/ssr/$serverMount";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function UnmountTest(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	$mount(() => {
		window.__unmountLog.push("mount")
		return () => {
			window.__unmountLog.push("cleanup")
		}
	})

	/* User interface */
	t_body += `<p id="content">Hello</p>`;

	return { body: t_body, head: t_head };
}
