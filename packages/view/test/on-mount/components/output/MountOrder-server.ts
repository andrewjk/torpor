import $mount from "../../../../src/ssr/$serverMount";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function MountOrder(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ order: "" });

	$mount(() => {
		(window as any).__mountLog.push("first");
		$state.order = (window as any).__mountLog.join(", ");
	});

	$mount(() => {
		(window as any).__mountLog.push("second");
		$state.order = (window as any).__mountLog.join(", ");
	});

	$mount(() => {
		(window as any).__mountLog.push("third");
		$state.order = (window as any).__mountLog.join(", ");
	});

	/* User interface */
	t_body += `<p>Mount order: ${t_fmt($state.order)}</p>`;

	return { body: t_body, head: t_head };
}
