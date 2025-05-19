import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function ArrayEntries(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<section> <p>^</p> <![>`;
	for (let [i, item] of $props.items.entries()) {
		$output += `<!^>  <span> ${t_fmt(i > 0 ? ", " : "")} ${t_fmt(item.text)} </span> `;
	}
	$output += `<!]><!> <p>$</p> </section>`;

	return $output;
}
