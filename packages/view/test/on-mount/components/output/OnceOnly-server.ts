import $onmount from "../../../../src/ssr/$serverOnmount";
import $run from "../../../../src/ssr/$serverRun";
import $watch from "../../../../src/ssr/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function OnmountNestedRun(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ count: 0 })
	let label: HTMLElement

	$onmount(() => {
		window.__log.push("setup")
		$run(() => {
			window.__log.push("run:" + $state.count)
			label.textContent = "run " + $state.count
		})
	})

	/* User interface */
	t_body += `<span></span> `;

	function increment() {
		$state.count += 1
	};

	t_body += ` <button id="inc">+</button>`;

	return { body: t_body, head: t_head };
}
