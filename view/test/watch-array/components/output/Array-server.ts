import type { ServerSlotRender } from "@tera/view";

export default function Array(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let item of $props.items) {
		$output += `<!^>  <p> ${t_fmt(item.text)} </p> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;
	
	return $output;
}

