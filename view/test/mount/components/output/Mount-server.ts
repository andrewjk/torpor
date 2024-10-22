import type { ServerSlotRender } from "@tera/view";

const $mount = (fn: Function) => null;
export default function Mount(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let inputElement;

	$mount(() => {
		inputElement.value = "hi";
	});

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<input self="${inputElement || ""}"/>`;
	return $output;
}

