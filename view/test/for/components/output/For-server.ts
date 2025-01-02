import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function For(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<section> <![>`;
	for (let i = 0; i < 5; i++) {
		$output += `<!^> <p> ${t_fmt(i)} </p> `;
	}
	$output += `<!]><!> </section>`;

	return $output;
}
