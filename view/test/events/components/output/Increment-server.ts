import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function Increment(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	const $state = $watch({ counter: 0 })

	function increment(e, num) {
		$state.counter += num || 1;
	}

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <button id="increment"> Increment </button> <button id="increment5"> Increment </button> <p> The count is ${t_fmt($state.counter)}. </p> </div>`;
	return $output;
}

