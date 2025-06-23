import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfElse(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	if ($props.counter > 7) {
		$output += ` <p> It's true! </p> <p> That's right </p> `;
	}
	else {
		$output += ` <p> It's not true... </p> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
