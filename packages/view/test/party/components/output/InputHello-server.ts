import $watch from "../../../../src/render/$serverWatch";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function InputHello(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let $state = $watch({
		text: "Hello World"
	});

	/* User interface */
	let $output = "";
	$output += ` <div> <p>${t_fmt($state.text)}</p> <input value="${t_attr($state.text) || ""}"> </div> `;

	return $output;
}
