import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
const $run = (fn: Function) => null;
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
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<p>Current time: ${t_fmt($state.time)}</p>`;
	return $output;
}

