import { ANCHOR_COMMENT } from "../../types/comments";
import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type RootNode from "../../types/nodes/RootNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../../utils/Builder";
import isReactive from "../../utils/isReactive";
import trimQuotes from "../../utils/trimQuotes";
import voidTags from "../../utils/voidTags";
import type BuildStatus from "./BuildStatus";

/**
 * Builds the HTML template text for all of the fragments in a component
 */
export default function buildFragmentText(
	node: RootNode | ControlNode,
	status: BuildStatus,
	b: Builder,
): void {
	const fragments: Fragment[] = [];
	buildNodeFragmentText(node, status, fragments);

	if (fragments.length) {
		b.append(`const t_fragments: DocumentFragment[] = [];`);
	}
}

function buildNodeFragmentText(
	node: TemplateNode,
	status: BuildStatus,
	fragments: Fragment[],
	currentFragment?: Fragment,
) {
	switch (node.type) {
		case "root": {
			buildRootFragmentText(node as RootNode, status, fragments);
			break;
		}
		case "control": {
			buildControlFragmentText(node as ControlNode, status, fragments, currentFragment!);
			break;
		}
		case "component": {
			buildComponentFragmentText(node as ElementNode, status, fragments, currentFragment!);
			break;
		}
		case "element": {
			// NOTE: We don't support nested SVG for now
			let ns = (node as ElementNode).tagName === "svg";
			if (ns) status.ns = true;
			buildElementFragmentText(node as ElementNode, status, fragments, currentFragment!);
			if (ns) status.ns = false;
			break;
		}
		case "text": {
			const content = (node as TextNode).content;
			if (currentFragment) {
				currentFragment.text += isReactive(content) ? "#" : content;
			}
			break;
		}
		case "special": {
			buildSpecialFragmentText(node as ElementNode, status, fragments, currentFragment!);
			break;
		}
	}
}

function buildRootFragmentText(node: RootNode, status: BuildStatus, fragments: Fragment[]) {
	node.fragment = {
		number: fragments.length,
		text: "",
		ns: status.ns,
		effects: [],
		events: [],
		animations: [],
	};
	fragments.push(node.fragment);
	for (let child of node.children) {
		buildNodeFragmentText(child, status, fragments, node.fragment);
	}
}

function buildControlFragmentText(
	node: ControlNode,
	status: BuildStatus,
	fragments: Fragment[],
	currentFragment: Fragment,
) {
	switch (node.operation) {
		case "@if group":
		case "@switch group":
		case "@for group":
		case "@await group":
		case "@replace group":
		case "@html group": {
			// Add a placeholder if it's a branching control node
			//if (!node.singleRooted) {
			currentFragment.text += ANCHOR_COMMENT;
			//}
			for (let child of node.children) {
				buildNodeFragmentText(child, status, fragments, currentFragment);
			}
			break;
		}
		default: {
			// Add a new fragment if it's a control branch and it has children
			node.fragment = {
				number: fragments.length,
				text: "",
				ns: status.ns,
				effects: [],
				events: [],
				animations: [],
			};
			fragments.push(node.fragment);
			for (let child of node.children) {
				buildNodeFragmentText(child, status, fragments, node.fragment);
			}
			break;
		}
	}
}

function buildComponentFragmentText(
	node: ElementNode,
	status: BuildStatus,
	fragments: Fragment[],
	currentFragment: Fragment,
) {
	currentFragment.text += ANCHOR_COMMENT;

	// Add fragments for slots if there are children
	if (node.children.length) {
		node.fragment = {
			number: fragments.length,
			text: "",
			ns: status.ns,
			effects: [],
			events: [],
			animations: [],
		};
		fragments.push(node.fragment);
		for (let child of node.children) {
			// TODO: Make sure it's not a fill node
			buildNodeFragmentText(child, status, fragments, node.fragment);
		}
	}
}

function buildElementFragmentText(
	node: ElementNode,
	status: BuildStatus,
	fragments: Fragment[],
	currentFragment: Fragment,
) {
	const tagName = node.tagName === "@element" ? "el" : node.tagName;
	let needsClass = node.scopeStyles;
	currentFragment.text += `<${tagName}`;
	let attributesText = node.attributes
		.filter((a) => !a.name.startsWith("on"))
		.map((a) => {
			if (a.value && a.reactive) {
				// Adding a placeholder for reactive attributes seems to speed things
				// up, especially in the case of data attributes. Otherwise don't set it
				if (a.name.startsWith("data-")) {
					return `${a.name}=""`;
				}
			} else if (a.name === "class" && node.scopeStyles) {
				needsClass = false;
				let value = a.value
					? `"${trimQuotes(a.value)} torp-${status.styleHash}"`
					: `"torp-${status.styleHash}"`;
				return `${a.name}=${value}`;
			} else {
				return `${a.name}${a.value != null ? `=${a.value}` : ""}`;
			}
		})
		.filter(Boolean)
		.join(" ");
	if (attributesText) {
		currentFragment.text += " " + attributesText;
	}
	if (needsClass) {
		currentFragment.text += ` class="torp-${status.styleHash}"`;
	}

	currentFragment.text += ">";

	if (!voidTags.includes(node.tagName)) {
		for (let child of node.children) {
			buildNodeFragmentText(child, status, fragments, currentFragment);
		}
		currentFragment.text += `</${tagName}>`;
	}
}

function buildSpecialFragmentText(
	node: ElementNode,
	status: BuildStatus,
	fragments: Fragment[],
	currentFragment: Fragment,
) {
	switch (node.tagName) {
		case "slot": {
			// Add an anchor for the slot
			currentFragment.text += ANCHOR_COMMENT;
			for (let child of node.children) {
				buildNodeFragmentText(child, status, fragments, node.fragment);
			}
			break;
		}
		case "fill": {
			// Add a new fragment for filled slot content
			node.fragment = {
				number: fragments.length,
				text: "",
				ns: status.ns,
				effects: [],
				events: [],
				animations: [],
			};
			fragments.push(node.fragment);
			for (let child of node.children) {
				buildNodeFragmentText(child, status, fragments, node.fragment);
			}
			break;
		}
		case "@element": {
			buildElementFragmentText(node, status, fragments, currentFragment);
			break;
		}
		case "@component": {
			buildComponentFragmentText(node, status, fragments, currentFragment);
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid special node: ${node.tagName}`);
		}
	}
}
