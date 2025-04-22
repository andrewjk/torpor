import { type ParseResult } from "../src/compile/types/ParseResult";
import { type Attribute } from "../src/compile/types/nodes/Attribute";
import { type ControlNode } from "../src/compile/types/nodes/ControlNode";
import { type ElementNode } from "../src/compile/types/nodes/ElementNode";
import { type OperationType } from "../src/compile/types/nodes/OperationType";
import { type RootNode } from "../src/compile/types/nodes/RootNode";
import { type TemplateNode } from "../src/compile/types/nodes/TemplateNode";
import { type TextNode } from "../src/compile/types/nodes/TextNode";

export function cmp(
	name: string,
	attributes?: Attribute[],
	children?: TemplateNode[],
	selfClosed?: boolean,
): ElementNode {
	return {
		type: "component",
		tagName: name,
		attributes: attributes || [],
		children: children || [],
		selfClosed,
	};
}

export function el(
	tagName: string,
	attributes?: Attribute[],
	children?: TemplateNode[],
	selfClosed?: boolean,
): ElementNode {
	return {
		type: "element",
		tagName,
		attributes: attributes || [],
		children: children || [],
		selfClosed,
		closed: true,
	};
}

export function sp(
	name: string,
	attributes?: Attribute[],
	children?: TemplateNode[],
	selfClosed?: boolean,
): ElementNode {
	return {
		type: "special",
		tagName: name,
		attributes: attributes || [],
		children: children || [],
		selfClosed,
	};
}

export function root(children?: TemplateNode[]): RootNode {
	return {
		type: "root",
		children: children || [],
	};
}

export function control(
	operation: OperationType,
	statement: string,
	children?: TemplateNode[],
): ControlNode {
	return {
		type: "control",
		operation,
		statement,
		children: children || [],
	};
}

export function text(content: string): TextNode {
	return {
		type: "text",
		content,
	};
}

export function att(name: string, value?: string): Attribute {
	return {
		name,
		value,
	};
}

export function trimParsed(result: ParseResult): ParseResult {
	const component = result.template?.components[0];
	if (component) {
		if (component.markup) {
			trimElement(component.markup);
		}
		//if (component.styleHash) {
		//	component.styleHash = undefined;
		//}
	}
	return result;
}

function trimElement(el: RootNode | ElementNode | ControlNode) {
	for (let i = el.children.length - 1; i >= 0; i--) {
		const child = el.children[i];
		if (child.type === "text") {
			const textChild = child as TextNode;
			textChild.content = textChild.content.trim();
			if (!textChild.content) {
				el.children.splice(i, 1);
			}
		} else if (child.type === "element" || child.type === "control") {
			// HACK:
			trimElement(child as ElementNode);
		}
	}
}

export function trimCode(code: string): string {
	//return code.split('\n').filter(l => !l.trim().startsWith("import"))
	return code.replace(/\/\*\*.+\*\/\n/gms, "");
}
