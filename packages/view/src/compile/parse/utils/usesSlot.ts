import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type TemplateNode from "../../types/nodes/TemplateNode";
import type TextNode from "../../types/nodes/TextNode";

const slotRegex = /\$slot\b/;

/**
 * Checks whether the $slot variable is read in the nodes' own scope
 *
 * Note that the children of a component node are excluded, because they are
 * passed to the component as fills, which get their own $slot parameter.
 * The component's attributes do belong to this scope.
 *
 * @param nodes The nodes to check
 *
 * @returns True if a $slot variable is read in the nodes' own scope
 */
export default function usesSlot(nodes: TemplateNode[]): boolean {
	for (let node of nodes) {
		if (node.type === "text") {
			const text = node as TextNode;
			if (slotRegex.test(text.content)) return true;
		} else if (node.type === "control") {
			const control = node as ControlNode;
			if (slotRegex.test(control.statement)) return true;
			if (usesSlot(control.children)) return true;
		} else if (node.type === "element" || node.type === "special" || node.type === "component") {
			const element = node as ElementNode;
			for (let attribute of element.attributes) {
				if (slotRegex.test(attribute.name)) return true;
				if (attribute.value && slotRegex.test(attribute.value)) return true;
			}
			if (element.type !== "component" && usesSlot(element.children)) return true;
		}
	}
	return false;
}
