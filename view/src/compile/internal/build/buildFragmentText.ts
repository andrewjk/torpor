import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type Node from "../../types/nodes/Node";
import type RootNode from "../../types/nodes/RootNode";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";
import { isReactive } from "./buildUtils";

/**
 * Builds the HTML template text for all of the fragments in a component
 */
export default function buildFragmentText(
  node: RootNode | ControlNode,
  status: BuildStatus,
  b: Builder,
) {
  const fragments: Fragment[] = [];
  buildNodeFragmentText(node, status, fragments);

  if (fragments.length) {
    b.append(`const t_fragments = [];`);
  }
}

function buildNodeFragmentText(
  node: Node,
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
      buildElementFragmentText(node as ElementNode, status, fragments, currentFragment!);
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
  node.fragment = { number: fragments.length, text: "", events: [] };
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
    case "@await group": {
      // Add a placeholder if it's a branching control node
      //if (!node.singleRooted) {
      currentFragment.text += "<!>";
      //}
      for (let child of node.children) {
        buildNodeFragmentText(child, status, fragments, currentFragment);
      }
      break;
    }
    default: {
      // Add a new fragment if it's a control branch and it has children
      node.fragment = { number: fragments.length, text: "", events: [] };
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
  currentFragment.text += "<!>";

  // Add fragments for slots if there are children
  if (node.children.length) {
    node.fragment = { number: fragments.length, text: "", events: [] };
    fragments.push(node.fragment);
    for (let child of node.children) {
      // TODO: Make sure it's not a :fill node
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
  currentFragment.text += `<${node.tagName}`;
  let attributesText = node.attributes
    .filter((a) => !a.name.startsWith("on") && !a.name.includes(":"))
    .map((a) => {
      if (isReactive(a.value) && !a.name.includes(":")) {
        // Adding a placeholder for reactive attributes seems to speed things
        // up, especially in the case of data attributes. Otherwise don't set it
        if (a.name.startsWith("data-")) {
          return `${a.name}=""`;
        }
      } else {
        return `${a.name}${a.value != null ? `=${a.value}` : ""}`;
      }
    })
    .filter(Boolean)
    .join(" ");
  if (attributesText) {
    currentFragment.text += " " + attributesText;
  }
  currentFragment.text += ">";
  for (let child of node.children) {
    buildNodeFragmentText(child, status, fragments, currentFragment);
  }
  currentFragment.text += `</${node.tagName}>`;
}

function buildSpecialFragmentText(
  node: ElementNode,
  status: BuildStatus,
  fragments: Fragment[],
  currentFragment: Fragment,
) {
  switch (node.tagName) {
    case ":slot": {
      // Add an anchor for the slot
      currentFragment.text += "<!>";
      for (let child of node.children) {
        buildNodeFragmentText(child, status, fragments, node.fragment);
      }
      break;
    }
    case ":fill": {
      // Add a new fragment for filled slot content
      node.fragment = { number: fragments.length, text: "", events: [] };
      fragments.push(node.fragment);
      for (let child of node.children) {
        buildNodeFragmentText(child, status, fragments, node.fragment);
      }
      break;
    }
  }
}
