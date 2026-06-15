import $mount from "../../../../src/ssr/$serverMount";
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

	let order: string[] = [];

	$mount(() => {
		order.push("first");
	});

	$mount(() => {
		order.push("second");
	});

	$mount(() => {
		order.push("third");
	});

	/* User interface */
	t_body += ` <p>Mount order: ${t_fmt(order.join(", "))}</p> `;

	return { body: t_body, head: t_head };
}
