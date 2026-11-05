import type ClassValue from "../types/ClassValue";
import buildClasses from "../render/buildClasses";

/**
 * Server counterpart of `render/buildClasses`: builds the class string and
 * wraps it in a `class="..."` attribute, or returns `""` when there are no
 * classes, so the attribute is omitted rather than rendered empty. Exported
 * as `t_class` from `@torpor/view/ssr` — the only way server-compiled code
 * uses it is to interpolate the attribute into a tag.
 */
export default function buildServerClasses(value: ClassValue, styleHash?: string): string {
	const classes = buildClasses(value, styleHash);
	return classes === "" ? "" : `class="${classes}"`;
}
