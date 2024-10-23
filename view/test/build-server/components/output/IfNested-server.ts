import type { ServerSlotRender } from "@tera/view/ssr";

export default function IfNested(
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
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

