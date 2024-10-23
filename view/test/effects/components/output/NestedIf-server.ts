import type { ServerSlotRender } from "@tera/view";

export default function NestedIf(
	$props: { condition: boolean, counter: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};
	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
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

