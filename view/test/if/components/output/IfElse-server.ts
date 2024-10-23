import type { ServerSlotRender } from "@tera/view/ssr";

export default function IfElse(
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	if ($props.counter > 7) {
		$output += ` <p> It's true! </p> `;
	}
	else {
		$output += ` <p> It's not true... </p> `;
	}
	$output += `<!]><!> </div>`;
	
	return $output;
}

