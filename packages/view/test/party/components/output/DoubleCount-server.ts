import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function DoubleCount(
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		count: 10,
		get doubleCount() {
			return this.count * 2;
		}
	});

	/* User interface */
	t_body += ` <div>${t_fmt($state.doubleCount)}</div> `;

	return { body: t_body, head: t_head };
}
