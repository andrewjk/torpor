import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfElseIf(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	if ($props.counter > 10) {
		$output += ` <p> It's over ten! </p> `;
	}
	else if ($props.counter > 5) {
		$output += ` <p> It's over five! </p> `;
	}
	else {
		$output += ` <p> It's not there yet </p> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
