import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Increment(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	const $state = $watch({ counter: 0 })

	function increment(e, num) {
		$state.counter += num || 1;
	}

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <button id="increment"> Increment </button> <button id="increment5"> Increment </button> <p> The count is ${t_fmt($state.counter)}. </p> `;

	return { body: t_body, head: t_head };
}
