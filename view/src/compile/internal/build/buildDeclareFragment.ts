import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type Node from "../../types/nodes/Node";
import type TextNode from "../../types/nodes/TextNode";
import { trimQuotes } from "../utils";
import type BuildStatus from "./BuildStatus";
import Builder from "./Builder";
import buildConfig from "./buildConfig";
import { isReactive, isReactiveAttribute, nextVarName } from "./buildUtils";

export default function buildDeclareFragment(
  node: ControlNode | ElementNode,
  status: BuildStatus,
  b: Builder,
) {
  if (node.fragment) {
    const fragment = node.fragment;
    const fragmentName = `t_fragment_${fragment.number}`;
    const root = node.type === "control" && (node as ControlNode).operation === "@root";
    if (buildConfig.fragmentsUseCreateElement) {
      // Declarations, then createXxx calls
      let existingVarPaths = new Map<string, string>();
      declareFragmentVars(node.fragment, node, ["0:ch"], status, b, existingVarPaths, root, true);

      existingVarPaths.clear();
      status.fragmentVars.clear();
      b.append(`const ${fragmentName} = t_frg([`);
      declareFragmentVars(node.fragment, node, ["0:ch"], status, b, existingVarPaths, root, false);
      b.append(`]);`);
    } else {
      // Text, then declarations
      const fragmentText = fragment.text.replaceAll("`", "\\`").replaceAll(/\s+/g, " ");
      b.append(
        `const ${fragmentName} = t_fragment(t_fragments, ${fragment.number}, \`${fragmentText}\`);`,
      );
      let existingVarPaths = new Map<string, string>();
      declareFragmentVars(node.fragment, node, ["0:ch"], status, b, existingVarPaths, root, true);
    }
  }
}

function declareFragmentVars(
  fragment: Fragment,
  node: Node,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  root: boolean,
  declare: boolean,
) {
  switch (node.type) {
    case "control": {
      declareControlFragmentVars(
        fragment,
        node as ControlNode,
        path,
        status,
        b,
        existingVarPaths,
        root,
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
        existingVarPaths,
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
        existingVarPaths,
        root,
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
        existingVarPaths,
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
        existingVarPaths,
        declare,
      );
      break;
    }
  }
}

function declareControlFragmentVars(
  fragment: Fragment,
  node: ControlNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  root: boolean,
  declare: boolean,
) {
  switch (node.operation) {
    case "@if group":
    case "@switch group":
    case "@for group":
    case "@await group": {
      const operation = node.operation.substring(1).replace(" group", "");
      declareParentAndAnchorFragmentVars(
        fragment,
        node,
        path,
        status,
        b,
        existingVarPaths,
        operation,
        declare,
      );
      break;
    }
    default: {
      for (let child of node.children) {
        declareFragmentVars(fragment, child, path, status, b, existingVarPaths, root, declare);
      }
      break;
    }
  }
}

function declareComponentFragmentVars(
  fragment: Fragment,
  node: ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  declare: boolean,
) {
  declareParentAndAnchorFragmentVars(
    fragment,
    node,
    path,
    status,
    b,
    existingVarPaths,
    "comp",
    declare,
  );
}

function declareElementFragmentVars(
  fragment: Fragment,
  node: ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  root: boolean,
  declare: boolean,
) {
  const pathIndex = path.slice(path.lastIndexOf("0:ch")).length - 1;
  path.push(`${pathIndex}:el:${node.tagName}`);

  const hasReactiveAttribute = node.attributes.some((a) => isReactiveAttribute(a.name, a.value));
  const setAttributes = root || hasReactiveAttribute;

  if (declare && setAttributes) {
    node.varName = nextVarName(node.tagName, status);
    const varPath = getFragmentVarPath(fragment, node.varName, path, existingVarPaths);
    if (buildConfig.fragmentsUseCreateElement) {
      b.append(`let ${node.varName};`);
    } else {
      b.append(`const ${node.varName} = ${varPath};`);
    }
    status.fragmentVars.set(varPath, node.varName);
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
          return `"${a.name}": ""`;
        } else {
          return `"${a.name}": "${trimQuotes(a.value) || a.name}"`;
        }
      })
      .join(", ");
    if (setAttributes) {
      b.append(
        `(${childParentName ? `${childParentName} = ` : ""}${node.varName} = t_elm("${node.tagName}", {${attributes}}, [`,
      );
    } else if (childParentName) {
      b.append(`(${childParentName} = t_elm("${node.tagName}", {${attributes}}, [`);
    } else {
      b.append(`t_elm("${node.tagName}", {${attributes}}, [`);
    }
  }

  const oldPathLength = path.length;
  path.push("0:ch");
  for (let child of node.children) {
    declareFragmentVars(fragment, child, path, status, b, existingVarPaths, false, declare);
  }
  path.splice(oldPathLength);

  if (!declare) {
    if (setAttributes || childParentName) {
      b.append("])),");
    } else {
      b.append("]),");
    }
  }
}

function declareTextFragmentVars(
  fragment: Fragment,
  node: TextNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  declare: boolean,
) {
  // Text nodes get merged together
  if (!path[path.length - 1].endsWith("txt")) {
    const pathIndex = path.slice(path.lastIndexOf("0:ch")).length - 1;
    path.push(`${pathIndex}:txt`);
  }

  if (declare) {
    if (isReactive(node.content)) {
      node.varName = nextVarName("text", status);
      const varPath = getFragmentVarPath(fragment, node.varName, path, existingVarPaths);
      if (buildConfig.fragmentsUseCreateElement) {
        b.append(`let ${node.varName};`);
      } else {
        b.append(`const ${node.varName} = ${varPath};`);
      }
      status.fragmentVars.set(varPath, node.varName);
    }
  } else {
    if (isReactive(node.content)) {
      b.append(`(${node.varName} = t_txt(" ")),`);
    } else {
      b.append(`t_txt("${node.content}"),`);
    }
  }
}

function declareSpecialFragmentVars(
  fragment: Fragment,
  node: ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  declare: boolean,
) {
  switch (node.tagName) {
    case ":slot": {
      declareParentAndAnchorFragmentVars(
        fragment,
        node,
        path,
        status,
        b,
        existingVarPaths,
        "slot",
        declare,
      );
      break;
    }
    case ":fill": {
      for (let child of node.children) {
        declareFragmentVars(fragment, child, path, status, b, existingVarPaths, false, declare);
      }
      break;
    }
  }
}

function declareParentAndAnchorFragmentVars(
  fragment: Fragment,
  node: ControlNode | ElementNode,
  path: string[],
  status: BuildStatus,
  b: Builder,
  existingVarPaths: Map<string, string>,
  name: string,
  declare: boolean,
) {
  // If the parent index is 0 it means it is the fragment, which can't be used as a parent
  // In that case we don't set the parentName so that the existing parent will be used
  const parentIndex = path.lastIndexOf("0:ch");
  const parentPath = path.slice(0, parentIndex);
  // TODO: This is not shortening the path correctly
  const parentVarPath = getFragmentVarPath(fragment, "?", parentPath, existingVarPaths);
  if (parentIndex === 0) {
    node.parentName = parentVarPath;
  } else if (status.fragmentVars.has(parentVarPath)) {
    node.parentName = status.fragmentVars.get(parentVarPath);
  } else {
    if (declare) {
      // TODO: Get the actual element that it is, which may involve getting parents of control nodes too
      node.parentName = nextVarName(`${name}_parent`, status);
      if (buildConfig.fragmentsUseCreateElement) {
        b.append(`let ${node.parentName};`);
      } else {
        b.append(`const ${node.parentName} = ${parentVarPath};`);
      }
      status.fragmentVars.set(parentVarPath, node.parentName);
    } else {
      // HACK: For the createElement option, this gets done in the parent
    }
  }

  if (declare) {
    const pathIndex = path.length - parentIndex - 1;
    path.push(`${pathIndex}:${name}`);
    node.varName = nextVarName(`${name}_anchor`, status);
    const varPath = getFragmentVarPath(fragment, node.varName, path, existingVarPaths);
    if (buildConfig.fragmentsUseCreateElement) {
      b.append(`let ${node.varName};`);
    } else {
      b.append(`const ${node.varName} = ${varPath};`);
    }
    status.fragmentVars.set(varPath, node.varName);
  } else {
    b.append(`(${node.varName} = t_cmt()),`);
  }
}

function getFragmentVarPath(
  fragment: Fragment,
  name: string,
  path: string[],
  existingVarPaths: Map<string, string>,
): string {
  let varPath = `t_fragment_${fragment.number}`;
  let childIndex = -2;
  for (let i = 0; i < path.length; i++) {
    const part = path[i].split(":")[1];
    if (part === "ch") {
      if (childIndex != -2) {
        //varPath += `.childNodes[${childIndex}]`;
        // This seems a little faster:
        varPath += ".firstChild";
        for (let i = 0; i < childIndex; i++) {
          varPath += ".nextSibling";
        }
      }
      childIndex = -1;
    } else {
      childIndex += 1;
    }
  }
  if (childIndex != -2) {
    //varPath += `.childNodes[${childIndex}]`;
    // This seems a little faster:
    varPath += ".firstChild";
    for (let i = 0; i < childIndex; i++) {
      varPath += ".nextSibling";
    }
  }

  // HACK: allow passing in "?" to ignore the parentVarPath
  if (name !== "?") {
    for (let [existingName, existingPath] of existingVarPaths) {
      if (varPath.includes(existingPath)) {
        varPath = varPath.replace(existingPath, existingName);
      }
    }
    existingVarPaths.set(name, varPath);
  }

  return varPath;
}
