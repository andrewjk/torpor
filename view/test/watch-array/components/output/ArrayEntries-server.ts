import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function ArrayEntries(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let [i, item] of $props.items.entries()) {
		$output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt(item.text)} </span> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;
	
	return $output;
}

