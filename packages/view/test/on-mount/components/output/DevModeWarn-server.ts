import $onmount from "../../../../src/ssr/$serverOnmount";
import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function OnmountOnce(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 0 })

	$onmount(() => {
		// @ts-ignore
		window.__log.push("onmount:" + $state.count)
	})

	/* User interface */
	t_body += `<p>Count: ${t_fmt($state.count)}</p> `;

	// @ts-ignore
	function increment() {
		$state.count += 1
	};

	t_body += ` <button id="inc">+</button>`;

	return { body: t_body, head: t_head };
}
