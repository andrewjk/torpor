import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function For(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <section> <![>`;
	for (let i = 0; i < 5; i++) {
		$output += `<!^> <p> ${t_fmt(i)} </p> `;
	}
	$output += `<!]><!> </section> `;

	return $output;
}
