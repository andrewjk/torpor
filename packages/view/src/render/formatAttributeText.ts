/**
 * Formats a value for inclusion in a double-quoted HTML attribute in
 * server-rendered markup. `&` is escaped first, so literal entity text in a
 * value (`a&quot;b`) survives the browser's decoding unchanged, then `"` so
 * the value can't close the attribute.
 */
export default function formatAttributeText(value: any): string {
	return (value ?? "").toString().replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
