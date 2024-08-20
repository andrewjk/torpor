import type TextNode from "../../types/nodes/TextNode";
import Builder from "../Builder";

export default function buildServerTextNode(node: TextNode, b: Builder) {
  let content = node.content || "";
  // Replace all spaces with a single space, both to save space and to remove
  // newlines from generated JS strings
  content = content.replace(/\s+/g, " ");

  // TODO: Should be fancier about this in parse -- e.g. ignore braces in
  // quotes, unclosed, etc
  let reactiveStarted = false;
  let reactiveCount = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") {
      reactiveStarted = true;
    } else if (content[i] === "}") {
      if (reactiveStarted) {
        reactiveCount += 1;
        reactiveStarted = false;
      }
    }
  }

  if (reactiveCount) {
    content = content.replaceAll("{", "${t_fmt(").replaceAll("}", ")}");
    b.append(`$output += \`${content}\`;`);
  } else {
    b.append(`$output += "${content}";`);
  }
}
