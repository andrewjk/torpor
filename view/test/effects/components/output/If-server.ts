import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function If(
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
		$output += ` <p>It's big</p> `;
	}
	else {
		$output += ` <p>It's small</p> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
