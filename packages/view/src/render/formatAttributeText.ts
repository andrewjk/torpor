import { escapeAttribute } from "../ssr/escape";

/**
 * Formats a value for inclusion in a double-quoted HTML attribute in
 * server-rendered markup. The escaping rules (and why `&` goes first) live in
 * `ssr/escape.ts`.
 *
 * Exported as `t_attr` from `@torpor/view/ssr`, so generated server code can
 * use it for interpolated attribute values; the other server helpers
 * (`ssr/buildAttribute`, `ssr/buildClasses`, `ssr/buildStyles`) use
 * `escapeAttribute` directly.
 */
export default function formatAttributeText(value: any): string {
	return escapeAttribute(value);
}
