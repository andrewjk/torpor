import type { ServerSlotRender } from "@tera/view";

export default function Colors(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	const colors = ["red", "green", "blue"];

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<ul> <![>`;
	for (let color of colors) {
		$output += `<!^>  <li>${t_fmt(color)}</li> `;
	}
	$output += `<!]><!> </ul>`;
	
	return $output;
}

