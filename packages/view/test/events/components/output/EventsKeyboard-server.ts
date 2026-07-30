import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function EventsKeyboard(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ lastKey: "none" });

	function handleKeyDown(e: KeyboardEvent) {
		$state.lastKey = e.key;
	}

	/* User interface */
	t_body += `<input id="keyinput"> <p>Last key: ${t_fmt($state.lastKey)}</p>`;

	return { body: t_body, head: t_head };
}
