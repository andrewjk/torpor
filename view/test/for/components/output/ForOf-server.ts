import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ForOf(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<section> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p> ${t_fmt(item)} </p> `;
	}
	$output += `<!]><!> </section>`;

	return $output;
}
