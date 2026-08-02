import isSpace from "../parse/utils/isSpace";
import type ControlNode from "../types/nodes/ControlNode";
import type ElementNode from "../types/nodes/ElementNode";
import type RootNode from "../types/nodes/RootNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import type TextNode from "../types/nodes/TextNode";
import isTextNode from "./isTextNode";

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
 * Mixed text nodes (containing non-whitespace content) are left untouched;
 * their internal whitespace continues to be collapsed at build time. The
 * walk mutates the tree in place and is idempotent.
 *
 * @param node The root node of the markup to trim (a component's markup or head)
 */
export default function trimWhitespace(node: ContainerNode): void {
	trimChildren(node.children, false, undefined);
}

function trimChildren(children: TemplateNode[], preserveAll: boolean, parentTag: string | undefined): void {
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

	// Remove pure-whitespace text nodes at the start of the container
	while (children.length && isWhitespaceText(children[0])) {
		children.shift();
	}
	// Remove pure-whitespace text nodes at the end of the container
	while (children.length && isWhitespaceText(children[children.length - 1])) {
		children.pop();
	}
	// Inside table/list containers, all remaining inter-child whitespace is
	// insignificant — remove it rather than collapsing to a space
	if (parentTag !== undefined && WHITESPACE_INSIGNIFICANT_TAGS.has(parentTag)) {
		for (let i = children.length - 1; i >= 0; i--) {
			if (isWhitespaceText(children[i])) {
				children.splice(i, 1);
			}
		}
		return;
	}
	// Collapse remaining pure-whitespace nodes (between siblings) to one space
	for (const child of children) {
		if (isTextNode(child) && child.content !== "" && isSpace(child.content)) {
			child.content = " ";
		}
	}
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
