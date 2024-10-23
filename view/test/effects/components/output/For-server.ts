import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function For(
	$props: { items: { text: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p>${t_fmt(item.text)}</p> `;
	}
	$output += `<!]><!> </div>`;
	
	return $output;
}

