import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function IfNested(
	$props: { counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	if ($props.counter > 5) {
		$output += ` <![>`;
		if ($props.counter > 10) {
			$output += ` <p> It's both true! </p> `;
		}
		else {
			$output += ` <p> The second is not true! </p> `;
		}
		$output += `<!]><!> `;
	}
	else {
		$output += ` <p> The first is not true! </p> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
