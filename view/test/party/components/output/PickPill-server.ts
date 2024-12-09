import { $watch } from "@tera/view/ssr";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import { t_fmt } from "@tera/view/ssr";

export default function PickPill(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		picked: "red"
	});

	/* User interface */
	let $output = "";
	$output += `<div> <div>Picked: ${t_fmt($state.picked)}</div> <input id="blue-pill" group="${t_attr($state.picked) || ""}" type="radio" value="blue"> <label for="blue-pill">Blue pill</label> <input id="red-pill" group="${t_attr($state.picked) || ""}" type="radio" value="red"> <label for="red-pill">Red pill</label> </div>`;

	return $output;
}
