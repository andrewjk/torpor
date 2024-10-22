import type { ServerSlotRender } from "@tera/view";

/**
 * A component with a switch statement in it.
 */
export default function Switch(
	$props: {
		/** The value to switch on */
		value: number
	},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	$props ??= {};

	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <![>`;
	switch ($props.value) {
		case 1: {
			$output += ` <p> A small value. </p> `;
			break;
		}
		case 100: {
			$output += ` <p> A large value. </p> `;
			break;
		}
		default: {
			$output += ` <p> Another value. </p> `;
			break;
		}
	}
	$output += `<!]><!> </div>`;
	return $output;
}

