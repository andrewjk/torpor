import type ElementNode from "../../types/nodes/ElementNode";
import type Node from "../../types/nodes/Node";
import type StyleBlock from "../../types/styles/StyleBlock";
import { trimQuotes } from "../utils";
import type ParseStatus from "./ParseStatus";

export default function checkAndApplyStyles(status: ParseStatus) {
  let selectors: string[] = [];
  if (status.style && status.styleHash && status.template) {
    for (let block of status.style.blocks) {
      collectStyleSelectors(block, selectors);
    }
    checkAndApplyStylesOnNode(status.template, selectors, status.styleHash);
  }
}

function checkAndApplyStylesOnNode(node: Node, selectors: string[], styleHash: string) {
  if (node.type === "element") {
    const element = node as ElementNode;
    let addClass = false;
    addClass =
      addClass || element.attributes.some((a) => a.name === "class" || a.name.startsWith("class:"));
    addClass = addClass || selectors.includes(element.tagName);
    if (!addClass) {
      for (let a of element.attributes) {
        if (a.name === "id") {
          addClass = selectors.includes(`#${trimQuotes(a.value)}`);
        } else if (a.name === "class") {
          addClass = selectors.includes(`.${trimQuotes(a.value)}`);
        }
        if (addClass) break;
      }
    }
    if (addClass) {
      element.attributes.push({
        name: "class",
        value: `"tera-${styleHash}"`,
      });
    }
  }

  if (node.type === "element" || node.type === "control") {
    for (let child of (node as ElementNode).children) {
      checkAndApplyStylesOnNode(child, selectors, styleHash);
    }
  }
}

function collectStyleSelectors(block: StyleBlock, selectors: string[]) {
  // HACK: We should be collecting the actual selectors and then checking attributes, parents, children, siblings etc
  for (let s of block.selector.split(/[\s*,>+~]/)) {
    selectors.push(s);
  }
}
