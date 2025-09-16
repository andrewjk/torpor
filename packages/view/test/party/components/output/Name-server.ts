import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Name(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
	let $state = $watch({
		name: "John"
	});

	/* User interface */
	t_body += ` <h1>Hello ${t_fmt($state.name)}</h1> `;

	return { body: t_body, head: t_head };
}
