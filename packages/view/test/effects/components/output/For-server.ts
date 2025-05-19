import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_fmt from "../../../../src/render/formatText";

export default function For(
	$props: { items: { text: string }[] },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let $output = "";
	$output += `<div> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <p>${t_fmt(item.text)}</p> `;
	}
	$output += `<!]><!> </div>`;

	return $output;
}
