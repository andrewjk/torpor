import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function AnswerButton(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <button>YES</button> <button>NO</button> `;

	return $output;
}
