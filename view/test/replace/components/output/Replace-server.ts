import type { ServerSlotRender } from "@tera/view";

export default function Replace(
	$props: { name: string},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	let counter = 0;

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <![>`;
	$props.name;
	$output += ` <p>The replace count is ${t_fmt(counter++)}.</p> `;
	$output += `<!]><!> </div>`;
	
	return $output;
}

