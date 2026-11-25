import type ParseOptions from "../types/ParseOptions";
import type TemplateNode from "../types/nodes/TemplateNode";
import isElementNode from "../utils/isElementNode";
import isParentNode from "../utils/isParentNode";
import nativeTags from "../utils/nativeTags";
import type ParseStatus from "./ParseStatus";
import slottifyChildNodes from "./slottifyChildNodes";
import addError from "./utils/addError";

/**
 * Classifies parsed tags as components or native elements once the whole file
 * has been parsed (so forward-declared local components are known).
 *
 * A tag is a component when its name is imported or is a component declared in
 * this file. Native and custom elements (`<div>`, `<my-widget>`,
 * `<linearGradient>`) stay elements. Any other capitalized tag is reported as
 * unknown instead of silently becoming a component call, unless the caller
 * opts into assuming external components (`allowUnknownComponents`).
 */
export default function classifyComponents(
	status: ParseStatus,
	importedNames: Set<string>,
	options?: ParseOptions,
): void {
	const localNames = new Set(
		status.components.map((component) => component.name).filter((name): name is string => !!name),
	);

	for (const component of status.components) {
		if (component.markup) {
			classifyNode(component.markup, status, importedNames, localNames, options);
		}
		if (component.error) {
			classifyNode(component.error, status, importedNames, localNames, options);
		}
		if (component.head) {
			classifyNode(component.head, status, importedNames, localNames, options);
		}
	}
}

function classifyNode(
	node: TemplateNode,
	status: ParseStatus,
	importedNames: Set<string>,
	localNames: Set<string>,
	options: ParseOptions | undefined,
): void {
	// Children first: slottifyChildNodes' usesSlot check has to see nested
	// components already typed as components (it doesn't look inside them)
	if (isParentNode(node)) {
		for (const child of node.children) {
			classifyNode(child, status, importedNames, localNames, options);
		}
	}

	if (!isElementNode(node)) return;

	const tagName = node.tagName;
	if (importedNames.has(tagName) || localNames.has(tagName)) {
		node.type = "component";
		slottifyChildNodes(node);
	} else if (!nativeTags.has(tagName) && !tagName.includes("-") && /^[A-Z]/.test(tagName)) {
		if (options?.allowUnknownComponents) {
			node.type = "component";
			slottifyChildNodes(node);
		} else {
			addError(
				status,
				`Unknown component or element: ${tagName}. Import it or define it in this file.`,
				node.span.start,
				node.span.end,
			);
		}
	}
}
