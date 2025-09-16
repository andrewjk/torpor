import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Function(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
	let $state = $watch({ counter: 0 })

	/* User interface */
	t_body += ` <button id="increment">Increment</button> `;

	function increment() {
		$state.counter += 1;
		let x = "";
	};

	t_body += ` <p> The count is ${t_fmt($state.counter)}. </p> `;

	return { body: t_body, head: t_head };
}
