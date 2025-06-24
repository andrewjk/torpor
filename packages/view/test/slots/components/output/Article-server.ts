import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Article(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += ` <section> <h2> <![>`;
	if ($slots && $slots["header"]) {
		$output += $slots["header"](undefined, $context);
	}
	$output += `<!]><!> </h2> <![>`;
	if ($slots && $slots["_"]) {
		$output += $slots["_"](undefined, $context);
	}
	$output += `<!]><!> <![>`;
	if ($slots && $slots["footer"]) {
		$output += $slots["footer"](undefined, $context);
	}
	$output += `<!]><!> </section> `;

	return $output;
}
