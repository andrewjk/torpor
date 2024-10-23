import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function For(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<section> <![>`;
	for (let i = 0; i < 5; i++) {
		$output += `<!^> <p> ${t_fmt(i)} </p> `;
	}
	$output += `<!]><!> </section>`;

	return $output;
}
