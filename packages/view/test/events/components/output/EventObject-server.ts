import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/ssr/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function EventObject(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ type: "", target: "", currentTarget: "" });

	/* User interface */
	t_body += `<button id="btn"> Click me </button> <p>Type: ${t_fmt($state.type)}</p> <p>Target: ${t_fmt($state.target)}</p> <p>Current: ${t_fmt($state.currentTarget)}</p>`;

	return { body: t_body, head: t_head };
}
