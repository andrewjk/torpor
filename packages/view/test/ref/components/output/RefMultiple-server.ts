import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function RefMultiple(
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	let inputEl: HTMLInputElement;
	let divEl: HTMLDivElement;

	/* User interface */
	t_body += `<input value="typed"> <div>Content</div> <p>Input value: ${t_fmt(inputEl?.value)}</p> <p>Div text: ${t_fmt(divEl?.textContent)}</p>`;

	return { body: t_body, head: t_head };
}
