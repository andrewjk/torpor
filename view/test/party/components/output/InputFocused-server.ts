import type { ServerSlotRender } from "@tera/view";

const $mount = (fn: Function) => null;
export default function InputFocused(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	let inputElement;

	$mount(() => {
		// HACK: This is easier to test for
		inputElement.value = "hi";
	});

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<input self="${inputElement || ""}"/>`;
	
	return $output;
}

