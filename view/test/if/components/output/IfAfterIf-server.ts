import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfAfterIf(
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	if ($props.counter > 10) {
		$output += ` <p> It's true! </p> `;
	}
	$output += `<!]><!> <![>`;
	if ($props.counter > 5) {
		$output += ` <p> It's also true! </p> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
