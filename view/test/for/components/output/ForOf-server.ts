import type { ServerSlotRender } from "@tera/view";

export default function ForOf(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<section> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p> ${t_fmt(item)} </p> `;
	}
	$output += `<!]><!> </section>`;
	return $output;
}

