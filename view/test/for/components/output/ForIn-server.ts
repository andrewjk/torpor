import type { ServerSlotRender } from "@tera/view";

export default function ForIn(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<section> <![>`;
	for (let key in $props.item) {
		$output += `<!^> <p> ${t_fmt($props.item[key])} </p> `;
	}
	$output += `<!]><!> </section>`;
	return $output;
}

