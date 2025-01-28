import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ArrayUnkeyed(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p> ${t_fmt(item.text)} </p> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;

	return $output;
}
