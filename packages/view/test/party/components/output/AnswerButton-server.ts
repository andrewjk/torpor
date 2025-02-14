import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function AnswerButton(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div> <button>YES</button> <button>NO</button> </div>`;

	return $output;
}
