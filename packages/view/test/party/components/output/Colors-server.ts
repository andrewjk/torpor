import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Colors(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	const colors = ["red", "green", "blue"];

	/* User interface */
	let $output = "";
	$output += ` <ul> <![>`;
	for (let color of colors) {
		$output += `<!^>  <li>${t_fmt(color)}</li> `;
	}
	$output += `<!]><!> </ul> `;

	return $output;
}
