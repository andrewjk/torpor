import type { ServerSlotRender } from "@tera/view";

const $watch = (obj: Record<PropertyKey, any>) => obj;
export default function PickPill(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	
	let $state = $watch({
		picked: "red"
	});

	
	/* User interface */
	const t_fmt = (text: string) => (text != null ? text : "");
	let $output = "";
	$output += `<div> <div>Picked: ${t_fmt($state.picked)}</div> <input id="blue-pill" group="${$state.picked || ""}" type="radio" value="blue"/> <label for="blue-pill">Blue pill</label> <input id="red-pill" group="${$state.picked || ""}" type="radio" value="red"/> <label for="red-pill">Red pill</label> </div>`;
	
	return $output;
}

