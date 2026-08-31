import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function CurrentTargetTest(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ currentTag: "" });

	/* User interface */
	t_body += `<button id="btn"><span>click</span></button> <p>Current: ${t_fmt($state.currentTag)}</p>`;

	return { body: t_body, head: t_head };
}
