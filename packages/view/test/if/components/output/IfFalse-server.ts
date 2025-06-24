import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfFalse(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <![>`;
	if ($props.counter > 7) {
		$output += `<!^> <p> It's true! </p> `;
	}
	$output += `<!]><!> `;

	return $output;
}
