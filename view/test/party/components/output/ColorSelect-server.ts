import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function ColorSelect(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
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
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <div>Selected: ${t_fmt(colors[$state.selectedColorId - 1].text)}</div> <select value="${$state.selectedColorId || ""}"> <![>`;
	for (let color of colors) {
		$output += `<!^> <option ${color.id ? `value="${color.id}"` : ''} ${color.isDisabled ? `disabled="${color.isDisabled}"` : ''}> ${t_fmt(color.text)} </option> `;
	}
	$output += `<!]><!> </select> </div>`;
	return $output;
}

