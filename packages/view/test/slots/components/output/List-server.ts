import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function List(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<ul> <![>`;
	for (let item of $props.items) {
		$output += `<!^> <li> <![>`;
		const t_sprops_1: any = {};
		t_sprops_1["item"] = item;
		if ($slots && $slots["_"]) {
			$output += $slots["_"](t_sprops_1, $context);
		}
		$output += `<!]><!> </li> `;
	}
	$output += `<!]><!> </ul>`;

	return $output;
}
