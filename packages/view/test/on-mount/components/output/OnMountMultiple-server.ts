import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function OnMountMultiple(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let inputEl: HTMLInputElement;
	let selectEl: HTMLSelectElement;

	/* User interface */
	t_body += `<input> <select><option>A</option><option>B</option><option>C</option></select> <p>Input: ${t_fmt(inputEl?.value)}</p> <p>Select: ${t_fmt(selectEl?.value)}</p>`;

	return { body: t_body, head: t_head };
}
