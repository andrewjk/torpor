import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function EventsMultiple(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 0, lastAction: "" });

	function handleClick() {
		$state.count += 1;
		$state.lastAction = "clicked";
	}

	function handleDblClick() {
		$state.count += 10;
		$state.lastAction = "double-clicked";
	}

	/* User interface */
	t_body += `<button id="single">Single Click</button> <button id="double">Double Click</button> <p>Count: ${t_fmt($state.count)}</p> <p>Last: ${t_fmt($state.lastAction)}</p>`;

	return { body: t_body, head: t_head };
}
