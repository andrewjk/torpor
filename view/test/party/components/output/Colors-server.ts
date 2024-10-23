import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function Colors(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	const colors = ["red", "green", "blue"];

	/* User interface */
	let $output = "";
	$output += `<ul> <![>`;
	for (let color of colors) {
		$output += `<!^>  <li>${t_fmt(color)}</li> `;
	}
	$output += `<!]><!> </ul>`;

	return $output;
}
