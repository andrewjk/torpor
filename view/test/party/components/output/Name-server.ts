import $watch from "../../../../src/render/$serverWatch";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Name(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		name: "John"
	});

	/* User interface */
	let $output = "";
	$output += `<h1>Hello ${t_fmt($state.name)}</h1>`;

	return $output;
}
