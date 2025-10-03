import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function DoubleCount(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
): void {
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
