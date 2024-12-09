import { $run } from "@tera/view/ssr";
import { $watch } from "@tera/view/ssr";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import { t_fmt } from "@tera/view/ssr";

export default function Time(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		time: new Date().toLocaleTimeString()
	});

	$run(() => {
		const timer = setInterval(() => {
			$state.time = new Date().toLocaleTimeString();
		}, 1000);

		return () => clearInterval(timer);
	});

	/* User interface */
	let $output = "";
	$output += `<p>Current time: ${t_fmt($state.time)}</p>`;

	return $output;
}
