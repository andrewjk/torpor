import { escapeAttribute } from "./escape";

/**
 * Builds a `name="value"` attribute for server-compiled code, dropping the
 * attribute entirely for `null`, `undefined` and `false` — matching the
 * client-side `t_attribute` — while an empty string or `0` still renders
 * (e.g. the meaningful `alt=""`). The value is HTML-escaped. Exported as
 * `t_attr_if` from `@torpor/view/ssr` — the only way server-compiled code
 * uses it is to interpolate the attribute into a tag.
 */
export default function buildServerAttribute(name: string, value: any): string {
	if (value == null || value === false) {
		return "";
	}
	return `${name}="${escapeAttribute(value)}"`;
}
