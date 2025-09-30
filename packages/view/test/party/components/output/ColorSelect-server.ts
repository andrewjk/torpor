import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function ColorSelect(
	_$props: Record<PropertyKey, any>,
	_$context: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	let $state = $watch({
		selectedColorId: 2
	});

	const colors = [
		{ id: 1, text: "red" },
		{ id: 2, text: "blue" },
		{ id: 3, text: "green" },
		{ id: 4, text: "gray", isDisabled: true },
	];

	/* User interface */
	t_body += ` <div>Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}</div> <select value="${t_attr($state.selectedColorId) || ""}"> <![>`;
	for (let color of colors) {
		t_body += `<!^> <option ${color.id ? `value="${t_attr(color.id)}"` : ''} ${color.isDisabled ? `disabled="${t_attr(color.isDisabled)}"` : ''}> ${t_fmt(color.text)} </option> `;
	}
	t_body += `<!]><!> </select> `;

	return { body: t_body, head: t_head };
}
