import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ForIn(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<section> <![>`;
	for (let key in $props.item) {
		$output += `<!^> <p> ${t_fmt($props.item[key])} </p> `;
	}
	$output += `<!]><!> </section>`;

	return $output;
}
