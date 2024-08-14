import type ElementNode from "../../types/nodes/ElementNode";
import type TextNode from "../../types/nodes/TextNode";
import type ParseStatus from "./ParseStatus";
import addSpaceElement from "./addSpaceElement";
import parseControl from "./parseControl";
import parseTag from "./parseTag";
import slottifyComponentChildNodes from "./slottifyComponentChildNodes";
import wrangleControl from "./wrangleControl";

// From https://developer.mozilla.org/en-US/docs/Glossary/Void_element
const voidTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

export default function parseElement(status: ParseStatus): ElementNode {
  const element = parseTag(status);

  if (!element.selfClosed && !voidTags.includes(element.tagName)) {
    // Get the children
    for (status.i; status.i < status.source.length; status.i++) {
      addSpaceElement(element, status);
      const char = status.source[status.i];
      if (char === "<") {
        if (status.source[status.i + 1] === "/") {
          // It's a closing element, so we're done here
          // TODO: Check that it's the correct closing element
          status.i = status.source.indexOf(">", status.i + 1);
          break;
        } else if (
          status.source[status.i + 1] === "!" &&
          status.source[status.i + 2] === "-" &&
          status.source[status.i + 3] === "-"
        ) {
          // It's a comment, swallow it
          status.i = status.source.indexOf("-->", status.i) + 3;
        } else {
          // It's a child element
          const child = parseElement(status);
          element.children.push(child);
        }
      } else if (char === "@") {
        const nextChars = status.source.substring(status.i, status.i + 3);
        if (nextChars === "@//") {
          // Swallow one-line comments
          status.i = status.source.indexOf("\n", status.i) + 1;
        } else if (nextChars === "@/*") {
          // Swallow multi-line comments
          status.i = status.source.indexOf("*/", status.i) + 2;
        } else {
          // It's a control statement
          const child = parseControl(status);
          wrangleControl(child, element);
        }
        /*
      } else if (char === "}") {
        // Check for an else
        const end = status.i;
        status.i += 1;
        consumeSpace(status);
        if (accept("else", status, false)) {
          const child = parseControl(status, "@each");
          element.children.push(child);
        } else {
          status.i = end;
        }
        */
      } else {
        // It's text content
        const start = status.i;
        const end = status.source.indexOf("<", status.i + 1);
        if (end !== -1) {
          const content = status.source.substring(start, end).trimEnd();
          const spaceContent = status.source.substring(start + content.length, end);
          if (content || spaceContent) {
            const previousNode = element.children[element.children.length - 1];
            if (previousNode?.type === "text") {
              (previousNode as TextNode).content += content + spaceContent;
            } else {
              const text: TextNode = {
                type: "text",
                content: content + spaceContent,
              };
              element.children.push(text);
            }
          }
          // Rewind to the < so that it will get checked in the next loop, above
          status.i = end - 1;
        }
      }
    }
  }

  /*
  if (
    element.children.length === 1 &&
    isTextNode(element.children[0]) &&
    !element.children[0].content.trim()
  ) {
    element.selfClosed = true;
    element.children = [];
  }
  */

  if (
    status.imports?.some((i) => i.component && i.name === element.tagName) ||
    status.childTemplates?.some((c) => c.name === element.tagName)
  ) {
    element.type = "component";
    slottifyComponentChildNodes(element);
  }

  return element;
}
