import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Function(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ counter: 0 })

	/* User interface */
	let $output = "";
	$output += `<div> <button id="increment">Increment</button> `;

	function increment() {
		$state.counter += 1;
	};

	$output += ` <p> The count is ${t_fmt($state.counter)}. </p> </div>`;

	return $output;
}
