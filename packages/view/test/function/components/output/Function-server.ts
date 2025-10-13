import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Function(
	// @ts-ignore
	$props: Record<PropertyKey, any> | undefined,
	// @ts-ignore
	$context: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ counter: 0 })

	/* User interface */
	t_body += ` <button id="increment">Increment</button> `;

	function increment() {
		$state.counter += 1;
	};

	t_body += ` <p> The count is ${t_fmt($state.counter)}. </p> `;

	return { body: t_body, head: t_head };
}
