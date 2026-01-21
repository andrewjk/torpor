import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Ref(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let button: HTMLButtonElement;

	/* User interface */
	t_body += ` <button> hi </button> <p> the button's text is '${t_fmt(button?.textContent)}' </p> `;

	return { body: t_body, head: t_head };
}
