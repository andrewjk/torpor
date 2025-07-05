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
	let $state = $watch({
		count: 0
	});

	function incrementCount() {
		$state.count++;
	}

	/* User interface */
	let $output = "";
	$output += ` <p>Counter: ${t_fmt($state.count)}</p> <button>+1</button> `;

	return $output;
}
