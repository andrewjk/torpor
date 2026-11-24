import type StyleValue from "../types/StyleValue";
import buildStyles from "../render/buildStyles";
import formatAttributeText from "../render/formatAttributeText";

/**
 * Server counterpart of `render/buildStyles`: builds the style string and
 * wraps it in a `style="..."` attribute, or returns `""` when there are no
 * styles, so the attribute is omitted rather than rendered empty. Exported
 * as `t_style` from `@torpor/view/ssr` — the only way server-compiled code
 * uses it is to interpolate the attribute into a tag. The value is
 * HTML-escaped, so a style value can't break out of the attribute.
 */
export default function buildServerStyles(value: StyleValue): string {
	const styles = buildStyles(value);
	return styles === "" ? "" : `style="${formatAttributeText(styles)}"`;
}
