import $run from "../../../../src/render/$serverRun";
import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function BindComponent(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ name: "Alice", selected: 1 });

	/* User interface */
	let $output = "";
	$output += ` <div> <![>`;
	const t_props_1: any = {};
	t_props_1["&name"] = $state.name;

	$output += BindText(t_props_1, $context)
	$output += `<!]><!> <p>Hello, ${t_fmt($state.name)}</p> </div> `;

	return $output;
}

function BindText(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};
	//let $state = $watch({
		//	text: $props.name
		//})

		// $run(() => t_name_changed($props.name))

		//$run(() => {
			//	$props.name = $state.text
			//});

			/* User interface */
			let $output = "";
			$output += ` <div> <input value="${t_attr($props.name) || ""}"> </div> `;

			return $output;
		}
