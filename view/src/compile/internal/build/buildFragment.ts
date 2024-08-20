import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type Node from "../../types/nodes/Node";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
import { isSpace } from "../parse/parseUtils";
import { trimQuotes } from "../utils";
import type BuildStatus from "./BuildStatus";
import buildConfig from "./buildConfig";
import buildNode from "./buildNode";
import { isReactive, isReactiveAttribute, nextVarName } from "./buildUtils";

interface VariablePath {
  parent: VariablePath | null;
  type: string;
  children: VariablePath[];
}

/**
 * Builds the variables and code in a fragment
 */
export default function buildFragment(
  node: ControlNode | ElementNode,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
) {
  if (node.fragment) {
    const fragment = node.fragment;
    const fragmentName = `t_fragment_${fragment.number}`;
    const root = node.type === "control" && (node as ControlNode).operation === "@root";
    if (buildConfig.fragmentsUseCreateElement) {
      // Declarations, then createXxx calls
      let rootPath = { parent: null, type: "root", children: [] };
      let varPaths = new Map<string, string>();
      declareFragmentVars(
        node.fragment,
        node,
        rootPath,
        status,
        b,
        parentName,
        anchorName,
        varPaths,
        root,
        false,
        true,
      );

      rootPath.children.length = 0;
      varPaths.clear();
      status.fragmentVars.clear();
      b.append(`const ${fragmentName} = t_frg([`);
      declareFragmentVars(
        node.fragment,
        node,
        rootPath,
        status,
        b,
        parentName,
        anchorName,
        varPaths,
        root,
        false,
        false,
      );
      b.append(`]);`);
    } else {
      // Text, then declarations
      const fragmentText = fragment.text.replaceAll("`", "\\`").replaceAll(/\s+/g, " ");
      const rootName = `t_root_${fragment.number}`;
      const rootFunction = `t_root(${fragmentName})`;
      b.append(
        `const ${fragmentName} = t_fragment(t_fragments, ${fragment.number}, \`${fragmentText}\`);
         const ${rootName} = ${rootFunction};`,
      );
      let rootPath = { parent: null, type: "root", children: [] };
      let varPaths = new Map<string, string>();
      varPaths.set(rootName, rootFunction);
      declareFragmentVars(
        node.fragment,
        node,
        rootPath,
        status,
        b,
        parentName,
        anchorName,
        varPaths,
        root,
        false,
        true,
      );
    }
  }
}

function declareFragmentVars(
  fragment: Fragment,
  node: Node,
  path: VariablePath,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  varPaths: Map<string, string>,
  root: boolean,
  lastChild: boolean,
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
        parentName,
        anchorName,
        varPaths,
        root,
        lastChild,
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
        lastChild,
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
        root,
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
        parentName,
        anchorName,
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
  }

  //buildNode(node, status, b, parentName, anchorName, root);
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
  root: boolean,
  lastChild: boolean,
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
        parentName,
        anchorName,
        varPaths,
        operation,
        lastChild,
        declare,
      );

      // Build nodes with anchors immediately, while we have their anchor node,
      // rather than at the end of the fragment
      buildNode(node, status, b, parentName, anchorName, false);
      node.handled = true;

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
          root,
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
  lastChild: boolean,
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
    lastChild,
    declare,
  );

  // Build nodes with anchors immediately, while we have their anchor node,
  // rather than at the end of the fragment
  buildNode(node, status, b, parentName, anchorName, false);
  node.handled = true;
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
  root: boolean,
  lastChild: boolean,
  declare: boolean,
) {
  const topLevel = !path.parent;

  let elementPath = { parent: path, type: node.tagName, children: [] };
  path.children.push(elementPath);

  const hasReactiveAttribute = node.attributes.some((a) => isReactiveAttribute(a.name, a.value));
  const setVariable = hasReactiveAttribute || root || (topLevel && lastChild);

  if (declare) {
    if (setVariable) {
      node.varName = nextVarName(node.tagName, status);
      if (topLevel) {
        fragment.endVarName = node.varName;
      }
      const varPath = getFragmentVarPath(fragment, node.varName, elementPath, varPaths);
      if (buildConfig.fragmentsUseCreateElement) {
        b.append(`let ${node.varName};`);
      } else {
        b.append(`const ${node.varName} = ${varPath};`);
      }
      status.fragmentVars.set(varPath, node.varName);
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
          return `"${a.name}": ""`;
        } else {
          return `"${a.name}": "${trimQuotes(a.value) || a.name}"`;
        }
      })
      .join(", ");
    if (setVariable) {
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
      false,
      i === node.children.length - 1,
      declare,
    );
  }

  if (!declare) {
    if (setVariable || childParentName) {
      b.append("])),");
    } else {
      b.append("]),");
    }
  }
}

function declareTextFragmentVars(
  fragment: Fragment,
  node: TextNode,
  path: VariablePath,
  status: BuildStatus,
  b: Builder,
  parentName: string,
  anchorName: string,
  varPaths: Map<string, string>,
  lastChild: boolean,
  declare: boolean,
) {
  const topLevel = !path.parent;

  // HACK: Text nodes get merged together
  // Is this because of control nodes like @key and @const??
  // TODO: We should do this when building for the server too
  const lastType = path.children[path.children.length - 1]?.type;
  if (lastType === "text" || lastType === "space") {
    return;
  }
  let textPath = { parent: path, type: isSpace(node.content) ? "space" : "text", children: [] };
  path.children.push(textPath);

  const setVariable = isReactive(node.content) || (topLevel && lastChild);

  if (declare) {
    if (setVariable) {
      node.varName = nextVarName("text", status);
      if (topLevel) {
        fragment.endVarName = node.varName;
      }
      const varPath = getFragmentVarPath(fragment, node.varName, textPath, varPaths);
      if (buildConfig.fragmentsUseCreateElement) {
        b.append(`let ${node.varName};`);
      } else {
        b.append(`const ${node.varName} = ${varPath};`);
      }
      status.fragmentVars.set(varPath, node.varName);
    }
  } else {
    if (setVariable) {
      b.append(`(${node.varName} = t_txt(" ")),`);
    } else {
      b.append(`t_txt("${node.content}"),`);
    }
  }
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
  switch (node.tagName) {
    case ":slot": {
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
        lastChild,
        declare,
      );
      break;
    }
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
          false,
          i === node.children.length - 1,
          declare,
        );
      }
      break;
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
  lastChild: boolean,
  declare: boolean,
) {
  const topLevel = !path.parent;

  if (topLevel) {
    // If there is no parent, it means the parent is the fragment
    node.parentName = `t_fragment_${fragment.number}`;
  } else {
    const parentPath = path;
    const oldChildren = parentPath.children;
    parentPath.children = [];
    // TODO: This is not shortening the path correctly
    const parentVarPath = getFragmentVarPath(fragment, "?", parentPath, varPaths);
    parentPath.children = oldChildren;
    if (status.fragmentVars.has(parentVarPath)) {
      node.parentName = status.fragmentVars.get(parentVarPath);
    } else {
      if (declare) {
        // TODO: Get the actual element that it is, which may involve getting
        // parents of control nodes too
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
  }

  if (declare) {
    const anchorPath = { parent: path, type: "#", children: [] };
    path.children.push(anchorPath);

    node.varName = nextVarName(`${name}_anchor`, status);
    const varPath = getFragmentVarPath(fragment, node.varName, anchorPath, varPaths);
    if (buildConfig.fragmentsUseCreateElement) {
      b.append(`let ${node.varName};`);
    } else {
      b.append(`const ${node.varName} = t_anchor(${varPath});`);
    }
    status.fragmentVars.set(varPath, node.varName);
  } else {
    b.append(`(${node.varName} = t_cmt()),`);
  }
}

function getFragmentVarPath(
  fragment: Fragment,
  name: string,
  path: VariablePath,
  varPaths: Map<string, string>,
): string {
  let node = path;
  while (node.parent) {
    node = node.parent;
  }
  let varPath = `t_fragment_${fragment.number}`;
  varPath = getFragmentVarPathPart(node, varPath, true);

  // HACK: allow passing in "?" to ignore the parentVarPath
  if (name !== "?") {
    for (let [existingName, existingPath] of varPaths) {
      if (varPath.includes(existingPath)) {
        varPath = varPath.replace(existingPath, existingName);
      }
    }
    varPaths.set(name, varPath);
  }

  return varPath;
}

function getFragmentVarPathPart(path: VariablePath, varPath: string, root = false): string {
  if (root) {
    varPath = `t_root(${varPath})`;
  } else {
    varPath = `t_child(${varPath})`;
  }
  for (let [i, child] of path.children.entries()) {
    if (i > 0) {
      varPath = `t_next(${varPath})`;
    }

    if (i === path.children.length - 1 && child.children.length) {
      varPath = getFragmentVarPathPart(child, varPath);
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
