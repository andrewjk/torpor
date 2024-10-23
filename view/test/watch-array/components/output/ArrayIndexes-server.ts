import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function ArrayIndexes(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let i = 0; i < $props.items.length; i++) {
		$output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt($props.items[i].text)} </span> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;

	return $output;
}
