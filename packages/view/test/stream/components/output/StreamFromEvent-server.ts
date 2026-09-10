import { $stream } from "@torpor/view/ssr";
import $watch from "../../../../src/ssr/$serverWatch";
import { fromElement } from "@torpor/view/ssr";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function StreamFromEvent(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let saveButton: HTMLButtonElement;

	let $state = $watch({
		count: 0,
	});

	$stream(fromElement(() => saveButton, "click"), () => {
		$state.count++;
	});

	/* User interface */
	t_body += `<button>Save</button> <p>Count: ${t_fmt($state.count)}</p>`;

	return { body: t_body, head: t_head };
}
