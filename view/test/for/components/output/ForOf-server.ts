import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function ForOf(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	$output += `<section> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p> ${t_fmt(item)} </p> `;
	}
	$output += `<!]><!> </section>`;
	
	return $output;
}

