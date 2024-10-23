import type { ServerSlotRender } from "@tera/view/ssr";

export default function NestedIf(
	$props: { condition: boolean, counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	if ($props.condition) {
		$output += ` <![>`;
		if ($props.counter > 5) {
			$output += ` <p>It's big</p> `;
		}
		else {
			$output += ` <p>It's small</p> `;
		}
		$output += `<!]><!> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
