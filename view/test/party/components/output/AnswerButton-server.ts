import type { ServerSlotRender } from "@tera/view";

export default function AnswerButton(
	$props: any,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <button>YES</button> <button>NO</button> </div>`;
	return $output;
}

