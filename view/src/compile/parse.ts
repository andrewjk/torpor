import type ParseStatus from "./internal/parse/ParseStatus";
import checkAndApplyStyles from "./internal/parse/checkAndApplyStyles";
import parseTemplate from "./internal/parse/parseTemplate";
import { isSpace } from "./internal/utils";
import type ParseResult from "./types/ParseResult";
import type ParentNode from "./types/nodes/ParentNode";
import type TextNode from "./types/nodes/TextNode";
import isControlNode from "./types/nodes/isControlNode";
import isParentNode from "./types/nodes/isParentNode";
import isTextNode from "./types/nodes/isTextNode";

export default function parse(source: string): ParseResult {
  const status: ParseStatus = {
    source,
    i: 0,
    errors: [],
  };

  parseTemplate(status, source);

  if (status.template) {
    processWhiteSpace(status.template);
    //setSingleRootedControlNodes(status.template);
  }

  checkAndApplyStyles(status);

  // HACK: get all usages of $props.name and $props["name"]
  const propsMatches = source.matchAll(/\$props\s*(?:\.([\d\w]+)|\["(.+)"\]|\['(.+)'\])/g);
  const props: string[] = [];
  for (let match of propsMatches) {
    const name = match[1] || match[2] || match[3];
    if (!props.includes(name)) {
      props.push(name);
    }
  }

  // HACK: get all usages of $context.name and $context["name"]
  const contextsMatches = source.matchAll(/\$context\s*(?:\.([\d\w]+)|\["(.+)"\]|\['(.+)'\])/g);
  const contexts: string[] = [];
  for (let match of contextsMatches) {
    const name = match[1] || match[2] || match[3];
    if (!contexts.includes(name)) {
      contexts.push(name);
    }
  }

  const ok = !status.errors.length;
  return {
    ok,
    errors: status.errors,
    parts: ok
      ? {
          docs: status.docs,
          imports: status.imports,
          script: status.script,
          template: status.template
            ? {
                type: "control",
                operation: "@root",
                statement: "",
                children: [status.template],
              }
            : undefined,
          childComponents: status.childTemplates,
          style: status.style,
          styleHash: status.styleHash,
          props: props.length ? props : undefined,
          contexts: contexts.length ? contexts : undefined,
        }
      : undefined,
  };
}

function processWhiteSpace(node: ParentNode) {
  // Remove spaces at the start of the node
  while (
    node.children.length &&
    isTextNode(node.children[0]) &&
    isSpace((node.children[0] as TextNode).content)
  ) {
    // HACK: But not before control nodes. Otherwise we can end up with a situation
    // where a control has a nested control and they both share start nodes. Then if
    // the inner control has its range cleared and then the outer control has its
    // range cleared, the start node will have already been cleared and everything
    // will go horribly wrong. Leaving a space is a cheap way to deal with this
    if (isControlNode(node.children[1])) {
      break;
    }

    node.children.shift();
  }

  // Remove spaces at the end of the node
  while (
    node.children.length &&
    isTextNode(node.children[node.children.length - 1]) &&
    isSpace((node.children[node.children.length - 1] as TextNode).content)
  ) {
    node.children.pop();
  }

  for (let child of node.children) {
    // Collapse whitespace between nodes
    if (isTextNode(child)) {
      if (isSpace(child.content)) {
        child.content = " ";
      } else {
        // Might be better gathering space nodes separately from text nodes
        // so this gets done consistently with the above?
        child.content = child.content.trim();
      }
    }
    // Recurse
    if (isParentNode(child)) {
      processWhiteSpace(child);
    }
  }
}

// This might still be handy, but I haven't got it to make a huge difference
// while messing around on perf. In theory, instead of adding and removing
// ranges in a control node that is the only node in its parent, we could
// just replace the whole thing
/*
function setSingleRootedControlNodes(node: ParentNode) {
  for (let child of node.children) {
    if (isControlNode(child) && node.children.length === 1) {
      child.singleRooted = true;
    }
    // Recurse
    if (isParentNode(child)) {
      setSingleRootedControlNodes(child);
    }
  }
}
*/
