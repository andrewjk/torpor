import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function Name(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		name: "John"
	});

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<h1>Hello ${t_fmt($state.name)}</h1>`;
	return $output;
}

