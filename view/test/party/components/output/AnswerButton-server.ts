import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

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
