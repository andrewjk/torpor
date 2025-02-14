import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function Array(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let item of $props.items) {
		$output += `<!^>  <p> ${t_fmt(item.text)} </p> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;

	return $output;
}
