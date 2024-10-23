import { $watch } from "@tera/view/ssr";
import type { ServerSlotRender } from "@tera/view/ssr";
import { t_fmt } from "@tera/view/ssr";

export default function DoubleCount(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	let $state = $watch({
		count: 10,
		get doubleCount() {
			return this.count * 2;
		}
	});

	
	/* User interface */
	let $output = "";
	$output += `<div>${t_fmt($state.doubleCount)}</div>`;
	
	return $output;
}

