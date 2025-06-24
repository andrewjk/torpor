import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Reactive(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({ text: "before" })

	/* User interface */
	let $output = "";
	$output += ` <div> <button>Update text</button> `;
	const t_props_1: any = {};
	t_props_1["text"] = $state.text;

	$output += Child(t_props_1, $context)
	$output += `<!> </div> `;

	return $output;
}

function Child(
	$props: any,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <p> ${t_fmt($props.text)} </p> `;

	return $output;
}
