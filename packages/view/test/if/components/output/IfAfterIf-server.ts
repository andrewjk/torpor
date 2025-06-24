import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfAfterIf(
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
	if ($props.counter > 10) {
		$output += `<!^> <p> It's true! </p> `;
	}
	$output += `<!]><!> <![>`;
	if ($props.counter > 5) {
		$output += `<!^> <p> It's also true! </p> `;
	}
	$output += `<!]><!> `;

	return $output;
}
