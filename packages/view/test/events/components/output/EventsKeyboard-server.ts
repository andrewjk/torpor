import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function EventsKeyboard(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
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
