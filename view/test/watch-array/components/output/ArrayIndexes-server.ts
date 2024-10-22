import type { ServerSlotRender } from "@tera/view";

export default function ArrayIndexes(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let i = 0; i < $props.items.length; i++) {
		$output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt($props.items[i].text)} </span> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;
	return $output;
}

