import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ParentChild(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <div> <![>`;
	const t_props_1: any = {};
	t_props_1["name"] = "Anna";

	$output += Child(t_props_1, $context)
	$output += `<!]><!> </div> `;

	return $output;
}

function Child(
	$props: { name: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += ` <h2>Hello, ${t_fmt($props.name)}</h2> `;

	return $output;
}
