import isSpace from "../../parse/utils/isSpace";
import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type RootNode from "../../types/nodes/RootNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import isReactive from "../../utils/isReactive";
import isSpecialNode from "../../utils/isSpecialNode";
import isTextNode from "../../utils/isTextNode";
import { NON_RENDERING_OPERATIONS } from "../../utils/nonRenderingOperations";
import trimQuotes from "../../utils/trimQuotes";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import buildNode from "./buildNode";

interface VariablePath {
	parent: VariablePath | null;
	type: string;
	children: VariablePath[];
}

/**
 * Builds the variables and code in a fragment
 */
export default function buildFragment(
	node: RootNode | ControlNode | ElementNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
): void {
	if (node.fragment) {
		const fragment = node.fragment;
		const fragmentName = `t_fragment_${fragment.number}`;
		if (status.options.useCreateElement === true) {
			// Declarations, then createXxx calls
			let fragmentPath = { parent: null, type: "fragment", children: [] };
			let varPaths = new Map<string, string>();
			declareFragmentVars(
				node.fragment,
				node,
				fragmentPath,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				false,
				true,
			);

			fragmentPath.children.length = 0;
			varPaths.clear();
			status.imports.add("t_frg");
			b.append(`const ${fragmentName} = t_frg([`);
			declareFragmentVars(
				node.fragment,
				node,
				fragmentPath,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				false,
				false,
			);
			b.append(`]);`);
		} else {
			// Text, then declarations
			const fragmentText = fragment.text.replaceAll("`", "\\`").replaceAll(/\s+/g, " ");
			if (fragment.singleRootElement) {
				// Single-root-element fast path: clone the cached template's
				// `firstElementChild` directly (skipping the per-instance
				// `DocumentFragment` wrapper that `t_fragment` produces).
				// Saves one allocation per created list-item / branch render,
				// which dominates the cost of bulk-row creates (`run`/`add`/
				// `runlots`) in the js-framework-bench.
				status.imports.add("t_fragment_el");
				b.append(
					`const ${fragmentName} = t_fragment_el($parent.ownerDocument!, t_fragment_els, ${fragment.number}, \`${fragmentText}\`${fragment.ns ? ", true" : ""});`,
				);
			} else {
				status.imports.add("t_fragment");
				b.append(
					`const ${fragmentName} = t_fragment($parent.ownerDocument!, t_fragments, ${fragment.number}, \`${fragmentText}\`${fragment.ns ? ", true" : ""});`,
				);
			}
			let fragmentPath = { parent: null, type: "fragment", children: [] };
			let varPaths = new Map<string, string>();
			maybeAddRootNodeDeclaration(node, fragment, fragmentName, status, b, varPaths);
			declareFragmentVars(
				node.fragment,
				node,
				fragmentPath,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				false,
				true,
			);
		}
	}
}

function maybeAddRootNodeDeclaration(
	node: RootNode | ControlNode | ElementNode,
	fragment: Fragment,
	fragmentName: string,
	status: BuildStatus,
	b: Builder,
	varPaths: Map<string, string>,
) {
	if (!node.children.length) return;

	// Always create a root variable. We need it both for subsequent node
	// traversal AND to pass to `t_add_fragment` so it can restore the active
	// region's `startNode` during hydration (child component rendering via
	// `addElement` overwrites it before `addFragment` runs).
	const rootName = `t_root_${fragment.number}`;
	const firstRendering = firstRenderingChild(node.children);
	const isTextRoot = !!(firstRendering && isTextNode(firstRendering));

	const rootFn = fragment.singleRootElement ? "t_root_el" : "t_root";
	status.imports.add(rootFn);
	const params = [fragmentName];
	if (!fragment.singleRootElement && isTextRoot) {
		params.push("true");
	}
	const rootPath = `${rootFn}(${params.join(", ")})`;
	b.append(`const ${rootName} = ${rootPath};`);
	// Register the root access for shortening so subsequent
	// `declareFragmentVars` traversals reuse `rootName` instead of
	// re-emitting the (matching) root function call.
	varPaths.set(`${rootFn}(${fragmentName})`, rootName);
	// Track the root variable for `t_add_fragment` (only needed for
	// multi-root fragments — single-root uses `t_add_element` which already
	// sets both start/end correctly).
	if (!fragment.singleRootElement) {
		fragment.rootVarName = rootName;
	}

	printDebug(rootName, status, b);
}

/**
 * Returns the first child that actually renders to the DOM, skipping comments
 * and no-output control nodes like @key/@const.
 */
function firstRenderingChild(children: TemplateNode[]): TemplateNode | undefined {
	for (const child of children) {
		if (child.type === "comment") continue;
		if (isControlNode(child) && NON_RENDERING_OPERATIONS.has(child.operation)) continue;
		return child;
	}
	return undefined;
}

function declareFragmentVars(
	fragment: Fragment,
	node: TemplateNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	lastChild: boolean,
	declare: boolean,
) {
	switch (node.type) {
		case "root": {
			declareRootFragmentVars(
				fragment,
				node as RootNode,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				declare,
			);
			break;
		}
		case "control": {
			declareControlFragmentVars(
				fragment,
				node as ControlNode,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				declare,
			);
			break;
		}
		case "component": {
			declareComponentFragmentVars(
				fragment,
				node as ElementNode,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				declare,
			);
			break;
		}
		case "element": {
			declareElementFragmentVars(
				fragment,
				node as ElementNode,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				lastChild,
				declare,
			);
			break;
		}
		case "text": {
			declareTextFragmentVars(
				fragment,
				node as TextNode,
				path,
				status,
				b,
				varPaths,
				lastChild,
				declare,
			);
			break;
		}
		case "special": {
			declareSpecialFragmentVars(
				fragment,
				node as ElementNode,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				lastChild,
				declare,
			);
			break;
		}
		case "comment": {
			// Don't output comments!
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid node type: ${node.type}`);
		}
	}
}

function declareRootFragmentVars(
	fragment: Fragment,
	node: RootNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	declare: boolean,
) {
	for (let [i, child] of node.children.entries()) {
		declareFragmentVars(
			fragment,
			child,
			path,
			status,
			b,
			parentName,
			anchorName,
			varPaths,
			i === node.children.length - 1,
			declare,
		);
	}
}

function declareControlFragmentVars(
	fragment: Fragment,
	node: ControlNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	declare: boolean,
) {
	switch (node.operation) {
		case "@if group":
		case "@switch group":
		case "@for group":
		case "@await group":
		case "@replace group":
		case "@html group": {
			const operation = node.operation.substring(1).replace(" group", "");
			declareParentAndAnchorFragmentVars(
				fragment,
				node,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				operation,
				declare,
			);
			break;
		}
		default: {
			for (let [i, child] of node.children.entries()) {
				declareFragmentVars(
					fragment,
					child,
					path,
					status,
					b,
					parentName,
					anchorName,
					varPaths,
					i === node.children.length - 1,
					declare,
				);
			}
			break;
		}
	}
}

function declareComponentFragmentVars(
	fragment: Fragment,
	node: ElementNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	declare: boolean,
) {
	declareParentAndAnchorFragmentVars(
		fragment,
		node,
		path,
		status,
		b,
		parentName,
		anchorName,
		varPaths,
		"comp",
		declare,
	);
}

function elementTypeName(node: ElementNode) {
	// TODO: Etc
	switch (node.tagName.toLowerCase()) {
		case "div":
		case "span":
		case "input":
		case "select":
		case "option":
		case "button":
		case "form":
			return `HTML${node.tagName.substring(0, 1).toUpperCase() + node.tagName.substring(1)}Element`;
		case "a":
			return "HTMLAnchorElement";
		case "img":
			return "HTMLImageElement";
		case "textarea":
			return "HTMLTextAreaElement";
		case "svg":
			return "SVGElement";
		case "line":
		case "text":
		case "path":
		case "rect":
			return `SVG${node.tagName.substring(0, 1).toUpperCase() + node.tagName.substring(1)}Element`;
	}
	return "HTMLElement";
}

function declareElementFragmentVars(
	fragment: Fragment,
	node: ElementNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	lastChild: boolean,
	declare: boolean,
) {
	const tagName = node.tagName === "@element" ? "element" : node.tagName;

	let elementPath = { parent: path, type: tagName, children: [] };
	path.children.push(elementPath);

	const topLevel = !path.parent;
	const declareVariable = elementNodeNeedsDeclaration(node, topLevel, lastChild);

	if (declare) {
		if (declareVariable) {
			node.varName = nextVarName(tagName, status);
			if (topLevel) {
				fragment.endVarName = node.varName;
			}
			const varPath = getFragmentVarPath(fragment, status, node.varName, elementPath, varPaths);
			if (status.options.useCreateElement === true) {
				b.append(`let ${node.varName};`);
			} else {
				if (node.tagName === "@element") {
					b.append(`let ${node.varName} = ${varPath} as ${elementTypeName(node)};`);
				} else {
					b.append(`const ${node.varName} = ${varPath} as ${elementTypeName(node)};`);
					printDebug(node.varName, status, b);
				}

				// Do &ref first, just in case any other attributes or
				// components depend on it being set e.g. if you have a `style`
				// attribute that depends on the element's size, or you are
				// passing the element to a component as an anchor
				const refAttribute = node.attributes.find((a) => a.name === "&ref");
				if (refAttribute) {
					let { value, fullyReactive } = refAttribute;
					if (value != null && fullyReactive) {
						// Bind the DOM element to a user-defined variable
						b.append(`${value} = ${node.varName};`);
					}
				}
			}
		}
	}

	// If there is an immediate child of this element that has this element as its parent,
	// we need to assign the element to the parent var
	// @ts-ignore
	let childParentName = node.children.find((c) => !!c.parentName)?.parentName;

	if (!declare) {
		let attributes = node.attributes
			.filter((a) => !a.name.startsWith("on"))
			.map((a) => {
				if (a.value && a.reactive) {
					// Adding a placeholder for reactive attributes seems to speed things
					// up, especially in the case of data attributes
					return `"${a.name}": "#"`;
				} else if (a.value) {
					return `"${a.name}": "${trimQuotes(a.value) || a.name}"`;
				} else {
					return `"${a.name}": true"`;
				}
			})
			.join(", ");

		status.imports.add("t_elm");
		if (declareVariable) {
			b.append(
				`(${childParentName ? `${childParentName} = ` : ""}${node.varName} = t_elm("${node.tagName}", {${attributes}}, [`,
			);
		} else if (childParentName) {
			b.append(`(${childParentName} = t_elm("${node.tagName}", {${attributes}}, [`);
		} else {
			b.append(`t_elm("${node.tagName}", {${attributes}}, [`);
		}
	}

	for (let [i, child] of node.children.entries()) {
		declareFragmentVars(
			fragment,
			child,
			elementPath,
			status,
			b,
			parentName,
			anchorName,
			varPaths,
			i === node.children.length - 1,
			declare,
		);
	}

	if (!declare) {
		if (declareVariable || childParentName) {
			b.append("])),");
		} else {
			b.append("]),");
		}
	}
}

function elementNodeNeedsDeclaration(node: ElementNode, topLevel: boolean, lastChild: boolean) {
	const hasReactiveAttribute = node.attributes.some((a) => a.value && a.reactive);
	const isDynamicElement =
		node.tagName === "@element" && node.attributes.find((a) => a.name === "self");
	return hasReactiveAttribute || isDynamicElement || (topLevel && lastChild);
}

function declareTextFragmentVars(
	fragment: Fragment,
	node: TextNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	varPaths: Map<string, string>,
	lastChild: boolean,
	declare: boolean,
) {
	// HACK: Text nodes get merged together
	// Is this because of control nodes like @key and @const??
	// TODO: We should do this when building for the server too
	const lastType = path.children[path.children.length - 1]?.type;
	if (lastType === "text" || lastType === "space") {
		return;
	}

	let textPath = { parent: path, type: isSpace(node.content) ? "space" : "text", children: [] };
	path.children.push(textPath);

	const topLevel = !path.parent;
	const declareVariable = textNodeNeedsDeclaration(node, topLevel, lastChild);

	if (declare) {
		if (declareVariable) {
			node.varName = nextVarName("text", status);
			if (topLevel) {
				fragment.endVarName = node.varName;
			}
			const varPath = getFragmentVarPath(fragment, status, node.varName, textPath, varPaths);
			if (status.options.useCreateElement === true) {
				b.append(`let ${node.varName};`);
			} else {
				b.append(`const ${node.varName} = ${varPath};`);
				printDebug(node.varName, status, b);
			}
		}
	} else {
		status.imports.add("t_txt");
		if (declareVariable) {
			b.append(`(${node.varName} = t_txt(" ")),`);
		} else {
			b.append(`t_txt("${node.content}"),`);
		}
	}
}

function textNodeNeedsDeclaration(node: TextNode, topLevel: boolean, lastChild: boolean) {
	return isReactive(node.content) || (topLevel && lastChild);
}

function declareSpecialFragmentVars(
	fragment: Fragment,
	node: ElementNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	lastChild: boolean,
	declare: boolean,
) {
	if (node.tagName === "slot") {
		declareParentAndAnchorFragmentVars(
			fragment,
			node,
			path,
			status,
			b,
			parentName,
			anchorName,
			varPaths,
			"slot",
			declare,
		);
	}

	switch (node.tagName) {
		case "slot":
		case "fill":
		case "filldef": {
			for (let [i, child] of node.children.entries()) {
				// Don't build the fill node twice
				if (
					node.tagName === "slot" &&
					isSpecialNode(child) &&
					(child.tagName === "fill" || child.tagName === "filldef")
				) {
					continue;
				}
				declareFragmentVars(
					fragment,
					child,
					path,
					status,
					b,
					parentName,
					anchorName,
					varPaths,
					i === node.children.length - 1,
					declare,
				);
			}
			break;
		}
		case "@element": {
			declareElementFragmentVars(
				fragment,
				node,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				lastChild,
				declare,
			);
			break;
		}
		case "@component": {
			declareComponentFragmentVars(
				fragment,
				node,
				path,
				status,
				b,
				parentName,
				anchorName,
				varPaths,
				declare,
			);
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
}

function declareParentAndAnchorFragmentVars(
	fragment: Fragment,
	node: ControlNode | ElementNode,
	path: VariablePath,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
	varPaths: Map<string, string>,
	name: string,
	declare: boolean,
) {
	const topLevel = !path.parent;

	// Declare the parent
	if (topLevel) {
		// If this is a top-level element, then the parent is the fragment
		node.parentName = `t_fragment_${fragment.number}`;
	} else {
		const parentPath = path;
		const oldChildren = parentPath.children;
		parentPath.children = [];
		const parentVarPath = getFragmentVarPath(fragment, status, "?", parentPath, varPaths);
		parentPath.children = oldChildren;
		// TODO: Should do this thing for the last child as well
		if (varPaths.has(parentVarPath)) {
			node.parentName = varPaths.get(parentVarPath);
		} else {
			if (declare) {
				node.parentName = nextVarName(`${name}_parent`, status);
				if (status.options.useCreateElement === true) {
					b.append(`let ${node.parentName} as HTMLElement;`);
				} else {
					b.append(`const ${node.parentName} = ${parentVarPath} as HTMLElement;`);

					printDebug(node.parentName, status, b);
				}
				varPaths.set(parentVarPath, node.parentName);
			} else {
				// HACK: For the createElement option, this gets done in the parent
			}
		}
	}

	// Declare the anchor
	if (declare) {
		const anchorPath = { parent: path, type: "#", children: [] };
		path.children.push(anchorPath);

		node.varName = nextVarName(`${name}_anchor`, status);
		// A top-level control node or component is the last node in its
		// fragment (its anchor comment is emitted after the preceding
		// elements). Track it as the fragment's end node so that region
		// clearing covers the whole fragment — mirroring what
		// `declareElementFragmentVars` / `declareTextFragmentVars` do for
		// element and text children.
		if (topLevel) {
			fragment.endVarName = node.varName;
		}
		const anchorVarPath = getFragmentVarPath(fragment, status, node.varName, anchorPath, varPaths);
		if (status.options.useCreateElement === true) {
			b.append(`let ${node.varName};`);
		} else {
			status.imports.add("t_anchor");
			b.append(`let ${node.varName} = t_anchor(${anchorVarPath}) as HTMLElement;`);

			printDebug(node.varName, status, b);
		}
	} else {
		status.imports.add("t_cmt");
		b.append(`(${node.varName} = t_cmt()),`);
	}

	// Build nodes with anchors immediately, while we have their anchor node,
	// rather than at the end of the fragment
	buildNode(node, status, b, parentName, anchorName);
	node.handled = true;
}

function getFragmentVarPath(
	fragment: Fragment,
	status: BuildStatus,
	name: string,
	path: VariablePath,
	varPaths: Map<string, string>,
): string {
	let node = path;
	while (node.parent) {
		node = node.parent;
	}
	let varName = `t_fragment_${fragment.number}`;
	// Single-root-element fragments clone the cached template's
	// `firstElementChild` directly, so the root access goes through
	// `t_root_el` (which passes the cloned element through in the
	// non-hydrating case and walks the hydration cursor when hydrating)
	// rather than `t_root` (which reads `fragment.firstChild`).
	const rootFn = fragment.singleRootElement ? "t_root_el" : "t_root";
	let varPath = getFragmentVarPathPart(node, varName, status, true, rootFn);

	// Check for parts of the path that have already been run to shorten our
	// traversal
	for (let [existingPath, existingName] of varPaths) {
		if (varPath.includes(existingPath)) {
			varPath = varPath.replace(existingPath, existingName);
		}
	}

	// HACK: allow passing in "?" to not add the parentVarPath to the existing
	// paths
	if (name !== "?") {
		// Add the path, so that we can shorten subsequent paths e.g.
		// const div = t_next(t_child(root));
		// const p = t_next(t_next(t_next(t_child(root))))
		// => const p = t_next(t_next(div))
		varPaths.set(varPath, name);
		// Add the name, so that we are always using the last declared name
		varPaths.set(name, name);
	}

	// Shorten `t_next(t_next(x))` to `t_skip(x, 2)`
	while (varPath.includes("t_next(t_next(")) {
		status.imports.add("t_skip");
		const match = varPath.match(/(t_next\(){2,}/)![0];
		const count = match.length / "t_next(".length;
		const pos = varPath.indexOf("t_next(t_next(");
		const head = varPath.substring(0, pos);
		let level = 0;
		let end = 0;
		for (let i = pos + match.length; i < varPath.length; i++) {
			if (varPath[i] === "(") {
				level++;
			} else if (varPath[i] === ")") {
				if (level === 0) {
					end = i;
					break;
				} else {
					level--;
				}
			}
		}
		const tail = varPath.substring(end + count);
		const param = varPath.substring(pos + match.length, end);
		varPath = `${head}t_skip(${param}, ${count})${tail}`;
	}

	// Set t_next_text back to t_next
	varPath = varPath.replaceAll("t_next_text", "t_next");

	return varPath;
}

function getFragmentVarPathPart(
	path: VariablePath,
	varPath: string,
	status: BuildStatus,
	root = false,
	rootFn = "t_root",
): string {
	if (root) {
		status.imports.add(rootFn);
		varPath = `${rootFn}(${varPath})`;
	} else {
		status.imports.add("t_child");
		varPath = `t_child(${varPath})`;
	}
	for (let [i, child] of path.children.entries()) {
		if (i > 0) {
			if (child.type === "text" || child.type === "space") {
				// HACK: Using t_next_text just stops t_next(node, true) from
				// being converted into t_skip
				varPath = `t_next_text(${varPath}, true)`;
			} else {
				status.imports.add("t_next");
				varPath = `t_next(${varPath})`;
			}
		}

		if (i === path.children.length - 1 && child.children.length) {
			// Nested levels always use `t_child`, never the single-root
			// `t_root_el` — that's only for the top of the path.
			varPath = getFragmentVarPathPart(child, varPath, status);
		}
	}
	return varPath;
}

const debug = false;
function printDebug(varName: string, status: BuildStatus, b: Builder) {
	if (debug) {
		status.imports.add("t_print");
		b.append(`console.log("${varName}:", t_print(${varName}));`);
	}
}

/*
function printPath(path: VariablePath) {
	let parent = path;
	while (parent.parent) {
		parent = parent.parent;
	}
	printPathPart(parent);
}

function printPathPart(path: VariablePath, indent = 0) {
	console.log(`${" ".repeat(indent * 2)}${path.type}`);
	for (let child of path.children) {
		printPathPart(child, indent + 1);
	}
}
*/
