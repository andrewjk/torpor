import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function InputHello(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		text: "Hello World"
	});

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <p>${t_fmt($state.text)}</p> <input value="${$state.text || ""}"/> </div>`;
	return $output;
}

