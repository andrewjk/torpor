import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Counter(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
	let $state = $watch({
		count: 0
	});

	function incrementCount() {
		$state.count++;
	}

	/* User interface */
	t_body += ` <p>Counter: ${t_fmt($state.count)}</p> <button>+1</button> `;

	return { body: t_body, head: t_head };
}
