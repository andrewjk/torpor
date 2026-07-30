import $watch from "../../../../src/ssr/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function EventObject(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let $state = $watch({ type: "", target: "", currentTarget: "" });

	/* User interface */
	t_body += `<button id="btn"> Click me </button> <p>Type: ${t_fmt($state.type)}</p> <p>Target: ${t_fmt($state.target)}</p> <p>Current: ${t_fmt($state.currentTarget)}</p>`;

	return { body: t_body, head: t_head };
}
