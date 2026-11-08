import { autoCloseMessage, closesAncestor, firstElementTag } from "../compile/utils/slotAutoClose";

/**
 * Server counterpart for generated slot regions whose wrapper the HTML
 * parser can auto-close (e.g. a `<slot>` inside `<li>`). Checks the rendered
 * fill content and throws when the parser would re-nest the region, so
 * broken shapes fail loudly at SSR instead of shipping markup hydration
 * can't adopt. Exported as `t_slot_guard` from `@torpor/view/ssr`.
 *
 * @param closeTags The slot's enclosing tags that some start tag can
 *   auto-close (nearest last).
 * @param content The rendered fill content.
 * @param slotName The slot name, for the error message.
 */
export default function slotGuard(closeTags: string[], content: string, slotName: string): string {
	const firstTag = firstElementTag(content);
	if (firstTag !== undefined && closesAncestor(firstTag, closeTags)) {
		const ancestor = closeTags
			.slice()
			.reverse()
			.find((ancestor) => closesAncestor(firstTag, [ancestor]));
		throw new Error(`Slot "${slotName}": ${autoCloseMessage(firstTag, ancestor ?? closeTags[0]!)}`);
	}
	return content;
}
