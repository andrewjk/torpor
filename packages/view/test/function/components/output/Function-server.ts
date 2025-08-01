import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Function(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ counter: 0 })

	/* User interface */
	let $output = "";
	$output += ` <button id="increment">Increment</button> `;

	function increment() {
		$state.counter += 1;
		let x = "";
	};

	$output += ` <p> The count is ${t_fmt($state.counter)}. </p> `;

	return $output;
}
