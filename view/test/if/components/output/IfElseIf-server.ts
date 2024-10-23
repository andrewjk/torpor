import type { ServerSlotRender } from "@tera/view";

export default function IfElseIf(
	$props: { counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
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

