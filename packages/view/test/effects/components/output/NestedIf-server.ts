import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function NestedIf(
	$props: { condition: boolean, counter: number },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <![>`;
	if ($props.condition) {
		$output += `<!^> <![>`;
		if ($props.counter > 5) {
			$output += `<!^> <p>It's big</p> `;
		}
		else {
			$output += `<!^> <p>It's small</p> `;
		}
		$output += `<!]><!> `;
	}
	$output += `<!]><!> `;

	return $output;
}
