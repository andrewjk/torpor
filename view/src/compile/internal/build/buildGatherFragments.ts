import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import type Fragment from "../../types/nodes/Fragment";
import type Node from "../../types/nodes/Node";
import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";
import type BuildStatus from "./BuildStatus";
import { isReactive } from "./buildUtils";

export default function buildGatherFragments(node: ControlNode, status: BuildStatus, b: Builder) {
  const fragments: Fragment[] = [];
  gatherFragments(node, status, fragments);

  if (fragments.length) {
    b.append(`const t_fragments = [];`);
  }
}

function gatherFragments(
  node: Node,
  status: BuildStatus,
  fragments: Fragment[],
  currentFragment?: Fragment,
) {
  switch (node.type) {
    case "control": {
      gatherControlFragments(node as ControlNode, status, fragments, currentFragment!);
      break;
    }
    case "component": {
      gatherComponentFragments(node as ElementNode, status, fragments, currentFragment!);
      break;
    }
    case "element": {
      gatherElementFragments(node as ElementNode, status, fragments, currentFragment!);
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
      gatherSpecialFragments(node as ElementNode, status, fragments, currentFragment!);
      break;
    }
  }
}

function gatherControlFragments(
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
        gatherFragments(child, status, fragments, currentFragment);
      }
      break;
    }
    default: {
      // Add a new fragment if it's a control branch and it has children
      node.fragment = { number: fragments.length, text: "", events: [] };
      fragments.push(node.fragment);
      for (let child of node.children) {
        gatherFragments(child, status, fragments, node.fragment);
      }
      break;
    }
  }
}

function gatherComponentFragments(
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
      gatherFragments(child, status, fragments, node.fragment);
    }
  }
}

function gatherElementFragments(
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
        // up, especially in the case of data attributes
        return `${a.name}=""`;
      } else {
        return `${a.name}${a.value != null ? `=${a.value}` : ""}`;
      }
    })
    .join(" ");
  if (attributesText) {
    currentFragment.text += " " + attributesText;
  }
  currentFragment.text += ">";
  for (let child of node.children) {
    gatherFragments(child, status, fragments, currentFragment);
  }
  currentFragment.text += `</${node.tagName}>`;
}

function gatherSpecialFragments(
  node: ElementNode,
  status: BuildStatus,
  fragments: Fragment[],
  currentFragment: Fragment,
) {
  switch (node.tagName) {
    case ":slot": {
      currentFragment.text += "<!>";

      // Add a new fragment for default slot content
      node.fragment = { number: fragments.length, text: "", events: [] };
      fragments.push(node.fragment);
      for (let child of node.children) {
        gatherFragments(child, status, fragments, node.fragment);
      }
      break;
    }
    case ":fill": {
      // Add a new fragment for filled slot content
      node.fragment = { number: fragments.length, text: "", events: [] };
      fragments.push(node.fragment);
      for (let child of node.children) {
        gatherFragments(child, status, fragments, node.fragment);
      }
      break;
    }
  }
}
