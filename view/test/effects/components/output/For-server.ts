import type { ServerSlotRender } from "@tera/view";

export default function For(
	$props: { items: { text: string }[] },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p>${t_fmt(item.text)}</p> `;
	}
	$output += `<!]><!> </div>`;
	return $output;
}

