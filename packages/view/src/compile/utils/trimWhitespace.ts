import isSpace from "../parse/utils/isSpace";
import type ControlNode from "../types/nodes/ControlNode";
import type ElementNode from "../types/nodes/ElementNode";
import type RootNode from "../types/nodes/RootNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import type TextNode from "../types/nodes/TextNode";
import isControlNode from "./isControlNode";
import isTextNode from "./isTextNode";
import { NON_RENDERING_OPERATIONS } from "./nonRenderingOperations";

/**
 * Tag names whose contents should keep all whitespace untouched, matching
 * native HTML rendering of `pre`/`textarea` and the existing build-time
 * `preserveWhitespace` behavior for `code`.
 */
const PRESERVE_TAGS = new Set(["pre", "textarea", "code"]);

/**
 * Container tags whose child layout ignores inter-child whitespace entirely
 * (table layout collapses it). Inside these, whitespace-only text nodes
 * between children are removed rather than collapsed to a single space.
 */
const WHITESPACE_INSIGNIFICANT_TAGS = new Set([
	"tr",
	"tbody",
	"thead",
	"tfoot",
	"colgroup",
	"table",
	"ul",
	"ol",
	"select",
]);

type ContainerNode = RootNode | ElementNode | ControlNode;

/**
 * Trims and collapses whitespace text nodes in a parsed markup tree,
 * Svelte 5-style:
 *
 * - pure-whitespace text nodes at the start/end of a container are removed
 * - pure-whitespace text nodes between siblings are collapsed to a single space
 *   (or removed entirely inside table/list containers where whitespace is
 *   insignificant — see WHITESPACE_INSIGNIFICANT_TAGS)
 * - whitespace inside `pre`, `textarea`, and `code` is preserved
 *
 * Whitespace adjacent to non-rendering control nodes (e.g. `@key`, `@const`)
 * is treated as leading/trailing whitespace of the container and removed,
 * because those nodes produce no DOM output — without this rule, every row
 * of `@for { @key = ...; <tr>...</tr> }` would emit a phantom leading
 * whitespace text node.
 *
 * Mixed text nodes (containing non-whitespace content) are left untouched;
 * their internal whitespace continues to be collapsed at build time. The
 * walk mutates the tree in place and is idempotent.
 *
 * @param node The root node of the markup to trim (a component's markup or head)
 */
export default function trimWhitespace(node: ContainerNode): void {
	trimChildren(node.children, false, undefined);
}

function trimChildren(
	children: TemplateNode[],
	preserveAll: boolean,
	parentTag: string | undefined,
): void {
	// Recurse depth-first so descendant containers are normalized before we
	// reason about siblings at this level
	for (const child of children) {
		const grandChildren = getChildren(child);
		if (grandChildren) {
			const childTag = getTagName(child);
			const childPreserve = preserveAll || PRESERVE_TAGS.has(childTag ?? "");
			trimChildren(grandChildren, childPreserve, childTag);
		}
	}

	if (preserveAll) return;

	// Inside table/list containers, all inter-child whitespace is
	// insignificant — remove it rather than collapsing to a space
	if (parentTag !== undefined && WHITESPACE_INSIGNIFICANT_TAGS.has(parentTag)) {
		for (let i = children.length - 1; i >= 0; i--) {
			if (isWhitespaceText(children[i])) {
				children.splice(i, 1);
			}
		}
		return;
	}

	// Compute leading/trailing masks that treat non-rendering control nodes
	// (e.g. @key, @const) as invisible, so that whitespace adjacent to them
	// is removed as if it were at the container edge. A whitespace text node
	// is "effectively leading" if no rendering sibling precedes it, and
	// "effectively trailing" if no rendering sibling follows it.
	const length = children.length;
	const hasRenderingBefore: boolean[] = Array.from({ length });
	const hasRenderingAfter: boolean[] = Array.from({ length });
	let seenBefore = false;
	let seenAfter = false;
	for (let i = 0; i < length; i++) {
		hasRenderingBefore[i] = seenBefore;
		if (isRenderingSibling(children[i])) seenBefore = true;
		const j = length - 1 - i;
		hasRenderingAfter[j] = seenAfter;
		if (isRenderingSibling(children[j])) seenAfter = true;
	}

	// Remove pure-whitespace nodes at the effectively-leading or
	// effectively-trailing edges of the container
	for (let i = length - 1; i >= 0; i--) {
		if (isWhitespaceText(children[i]) && (!hasRenderingBefore[i] || !hasRenderingAfter[i])) {
			children.splice(i, 1);
		}
	}

	// Collapse remaining pure-whitespace nodes (between rendering siblings) to one space
	for (const child of children) {
		if (isTextNode(child) && child.content !== "" && isSpace(child.content)) {
			child.content = " ";
		}
	}
}

/**
 * Returns true if `node` is a "rendering sibling" — i.e. a node that produces
 * visible DOM output and therefore acts as a boundary between leading,
 * inter-sibling, and trailing whitespace. Whitespace text nodes themselves
 * (the subject of the trim) and non-rendering control nodes (e.g. @key,
 * @const) are not rendering siblings.
 */
function isRenderingSibling(node: TemplateNode): boolean {
	if (isWhitespaceText(node)) return false;
	if (isControlNode(node) && NON_RENDERING_OPERATIONS.has(node.operation)) return false;
	return true;
}

function getChildren(node: TemplateNode): TemplateNode[] | undefined {
	if (node.type === "text" || node.type === "comment") return undefined;
	return (node as ContainerNode).children;
}

function getTagName(node: TemplateNode): string | undefined {
	if (node.type === "element" || node.type === "component" || node.type === "special") {
		return (node as ElementNode).tagName;
	}
	return undefined;
}

function isWhitespaceText(node: TemplateNode): node is TextNode {
	return isTextNode(node) && node.content !== "" && isSpace(node.content);
}
