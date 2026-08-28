import formatAttributeText from "./formatAttributeText";

/**
 * Renders the entries of a spread attribute object (`{...attrs}`) as HTML
 * attribute text, for server side rendering. Event handlers (`on*` keys) are
 * skipped, as are `false`, `undefined` and `null` values -- matching the
 * client side `t_spread`.
 */
export default function spreadAttributesHtml(
	attrs: Record<string, any> | undefined | null,
): string {
	if (attrs == null) return "";
	let result = "";
	for (let [name, value] of Object.entries(attrs)) {
		if (name.startsWith("on")) continue;
		if (value === false || value === undefined || value === null) continue;
		result += ` ${name}="${formatAttributeText(value)}"`;
	}
	return result;
}
