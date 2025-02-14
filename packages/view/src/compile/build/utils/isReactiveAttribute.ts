import isFullyReactive from "./isFullyReactive";
import isReactive from "./isReactive";

/**
 * Checks whether the supplied attribute is reactive (i.e. its name starts and
 * ends with braces, its value contains braces, or it's an event)
 *
 * @param name The attribute's name
 * @param value The attribute's value
 *
 * @returns True if the supplied attribute is reactive
 */
export default function isReactiveAttribute(name: string, value: string) {
	// TODO: Better checking of whether an attribute is reactive
	return isFullyReactive(name) || isReactive(value) || name.startsWith("on");
}
