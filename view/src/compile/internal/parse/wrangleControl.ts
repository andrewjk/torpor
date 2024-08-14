import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";

export default function wrangleControl(
  control: ControlNode,
  parentNode: ElementNode | ControlNode,
) {
  // HACK: Wrangle if/then/else into an if group, for into a for group, and
  // await/then/catch into an await group
  if (control.operation === "@if") {
    const ifGroup: ControlNode = {
      type: "control",
      operation: "@if group",
      statement: "",
      children: [control],
    };
    parentNode.children.push(ifGroup);
  } else if (control.operation === "@else") {
    if (/^else\s+if/.test(control.statement)) {
      control.operation = "@else if";
    }
    for (let i = parentNode.children.length - 1; i >= 0; i--) {
      const lastChild = parentNode.children[i];
      // TODO: Break if it's an element, do more checking
      if (lastChild.type === "control" && (lastChild as ControlNode).operation === "@if group") {
        (lastChild as ControlNode).children.push(control);
        break;
      }
    }
    // @ts-ignore
  } else if (control.operation === "@for") {
    const forGroup: ControlNode = {
      type: "control",
      operation: "@for group",
      statement: "",
      children: [control],
    };
    parentNode.children.push(forGroup);
    // @ts-ignore
  } else if (control.operation === "@switch") {
    control.operation = "@switch group";
    parentNode.children.push(control);
  } else if (control.operation === "@await") {
    const awaitGroup: ControlNode = {
      type: "control",
      operation: "@await group",
      statement: "",
      children: [control],
    };
    parentNode.children.push(awaitGroup);
  } else if (control.operation === "@then" || control.operation === "@catch") {
    for (let i = parentNode.children.length - 1; i >= 0; i--) {
      const lastChild = parentNode.children[i];
      // TODO: Break if it's an element, do more checking
      if (lastChild.type === "control" && (lastChild as ControlNode).operation === "@await group") {
        (lastChild as ControlNode).children.push(control);
        break;
      }
    }
  } else {
    parentNode.children.push(control);
  }
}
