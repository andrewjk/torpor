import type { ServerSlotRender } from "@tera/view";

export default function ArrayEntries(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let [i, item] of $props.items.entries()) {
		$output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt(item.text)} </span> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;
	return $output;
}

