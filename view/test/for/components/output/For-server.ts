import type { ServerSlotRender } from "@tera/view";

export default function For(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<section> <![>`;
	for (let i = 0; i < 5; i++) {
		$output += `<!^> <p> ${t_fmt(i)} </p> `;
	}
	$output += `<!]><!> </section>`;
	return $output;
}

