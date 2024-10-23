import type { ServerSlotRender } from "@tera/view/ssr";

export default function AnswerButton(
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	$output += `<div> <button>YES</button> <button>NO</button> </div>`;
	
	return $output;
}

