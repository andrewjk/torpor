import Builder from "../../Builder";
import isSpace from "../../parse/utils/isSpace";
import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type RootNode from "../../types/nodes/RootNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";
import isControlNode from "../../types/nodes/isControlNode";
import isElementNode from "../../types/nodes/isElementNode";
import isTextNode from "../../types/nodes/isTextNode";
import trimQuotes from "../../utils/trimQuotes";
import isReactive from "../utils/isReactive";
import isReactiveAttribute from "../utils/isReactiveAttribute";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import buildConfig from "./buildConfig";
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
) {
	if (node.fragment) {
		const fragment = node.fragment;
		const fragmentName = `t_fragment_${fragment.number}`;
		if (buildConfig.fragmentsUseCreateElement) {
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
			status.imports.add("t_fragment");
			const fragmentText = fragment.text.replaceAll("`", "\\`").replaceAll(/\s+/g, " ");
			b.append(
				`const ${fragmentName} = t_fragment(t_fragments, ${fragment.number}, \`${fragmentText}\`);`,
			);
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
	// We need to store the root node of the fragment for subsequent updates of the fragment
	// But not if the node would be declared anyway
	let firstNode = node.children[0];
	let firstNodeIsLastNode = node.children.length === 1;
	if (
		(isControlNode(firstNode) && firstNode.operation.endsWith(" group")) ||
		(isElementNode(firstNode) &&
			elementNodeNeedsDeclaration(firstNode, true, firstNodeIsLastNode)) ||
		(isTextNode(firstNode) && textNodeNeedsDeclaration(firstNode, true, firstNodeIsLastNode))
	) {
		// It's going to be declared later on
	} else {
		status.imports.add("t_root");
		const rootName = `t_root_${fragment.number}`;
		const rootPath = `t_root(${fragmentName})`;
		b.append(`const ${rootName} = ${rootPath};`);
		varPaths.set(rootPath, rootName);
		//b.append(`console.log("${rootName}", ${rootName}, ${rootName}.textContent);`);
	}
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
		default: {
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
		case "@replace group": {
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
	const tagName = node.tagName === ":element" ? "element" : node.tagName;

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
			if (buildConfig.fragmentsUseCreateElement) {
				b.append(`let ${node.varName};`);
			} else {
				if (node.tagName === ":element") {
					b.append(`let ${node.varName} = ${varPath};`);
				} else {
					b.append(`const ${node.varName} = ${varPath};`);
				}
				//b.append(`console.log("${node.varName}", ${node.varName}, ${node.varName}.textContent);`);
			}
		}
	}

	// If there is an immediate child of this element that has this element as its parent,
	// we need to assign the element to the parent var
	// @ts-ignore
	let childParentName = node.children.find((c) => !!c.parentName)?.parentName;

	if (!declare) {
		let attributes = node.attributes
			.filter((a) => !a.name.startsWith("on") && !a.name.includes(":"))
			.map((a) => {
				if (isReactive(a.value)) {
					// Adding a placeholder for reactive attributes seems to speed things
					// up, especially in the case of data attributes
					return `"${a.name}": "#"`;
				} else {
					return `"${a.name}": "${trimQuotes(a.value) || a.name}"`;
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
	const hasReactiveAttribute = node.attributes.some((a) => isReactiveAttribute(a.name, a.value));
	const isDynamicElement =
		node.tagName === ":element" && node.attributes.find((a) => a.name === "tag");
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
			if (buildConfig.fragmentsUseCreateElement) {
				b.append(`let ${node.varName};`);
			} else {
				b.append(`const ${node.varName} = ${varPath};`);
				//b.append(`console.log("${node.varName}", ${node.varName}, ${node.varName}.textContent);`);
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
	if (node.tagName === ":slot") {
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
		case ":element": {
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
		case ":slot":
		case ":fill": {
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
		default: {
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
				if (buildConfig.fragmentsUseCreateElement) {
					b.append(`let ${node.parentName};`);
				} else {
					b.append(`const ${node.parentName} = ${parentVarPath};`);
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
		const varPath = getFragmentVarPath(fragment, status, node.varName, anchorPath, varPaths);
		if (buildConfig.fragmentsUseCreateElement) {
			b.append(`let ${node.varName};`);
		} else {
			status.imports.add("t_anchor");
			b.append(`const ${node.varName} = t_anchor(${varPath});`);
			//b.append(`console.log("${node.varName}", ${node.varName}, ${node.varName}.textContent);`);
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
	let varPath = `t_fragment_${fragment.number}`;
	varPath = getFragmentVarPathPart(node, varPath, status, true);

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
		// const p = t_next(t_next(t_next(t_child(root)))) => t_next(t_next(div))
		varPaths.set(varPath, name);
		// Add the name, so that we are always using the last declared name
		varPaths.set(name, name);
	}

	return varPath;
}

function getFragmentVarPathPart(
	path: VariablePath,
	varPath: string,
	status: BuildStatus,
	root = false,
): string {
	if (root) {
		status.imports.add("t_root");
		varPath = `t_root(${varPath})`;
	} else {
		status.imports.add("t_child");
		varPath = `t_child(${varPath})`;
	}
	for (let [i, child] of path.children.entries()) {
		if (i > 0) {
			status.imports.add("t_next");
			varPath = `t_next(${varPath})`;
		}

		if (i === path.children.length - 1 && child.children.length) {
			varPath = getFragmentVarPathPart(child, varPath, status);
		}
	}
	return varPath;
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
