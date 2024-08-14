import type CompileError from "../../types/CompileError";
import type Attribute from "../../types/styles/Attribute";
import type Style from "../../types/styles/Style";
import type StyleBlock from "../../types/styles/StyleBlock";
import hash from "../hash";
import type ParseStatus from "./ParseStatus";
import { accept, addError, consumeSpace, consumeUntil } from "./parseUtils";

interface StyleStatus {
  source: string;
  i: number;
  errors: CompileError[];
}

export default function parseStyleElement(status: ParseStatus): Style {
  const style: Style = {
    global: false,
    blocks: [],
  };

  // Extract the content between the style tags without comments
  const source = getStyleSource(status).trim();
  status.styleHash = hash(source);

  const styleStatus: StyleStatus = {
    source,
    i: 0,
    errors: [],
  };

  for (styleStatus.i; styleStatus.i < styleStatus.source.length; styleStatus.i++) {
    consumeSpace(styleStatus);
    const block = parseStyleBlock(styleStatus);
    style.blocks.push(block);
  }

  status.errors = status.errors.concat(styleStatus.errors);

  return style;
}

function getStyleSource(status: ParseStatus): string {
  const start = status.i;

  let style = "";
  for (status.i; status.i < status.source.length; status.i++) {
    const char = status.source[status.i];
    if (char === "<" && status.source.substring(status.i, status.i + 8) === "</style>") {
      status.i += 8;
      return style;
    } else if (char === "/") {
      const nextChar = status.source[status.i + 1];
      if (nextChar === "/") {
        // Ignore the content of one-line comments
        status.i += 2;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === "\n") {
            break;
          }
        }
      } else if (nextChar === "*") {
        // Ignore the content of multiple-line comments
        status.i += 2;
        for (status.i; status.i < status.source.length; status.i++) {
          if (status.source[status.i] === "/" && status.source[status.i - 1] === "*") {
            break;
          }
        }
      }
    } else {
      style += char;
    }
  }

  addError(status, "Unclosed style element", start);
  return "";
}

function parseStyleBlock(status: ParseStatus): StyleBlock {
  const selector = consumeUntil("{", status).trim();
  accept("{", status);
  const block: StyleBlock = {
    selector,
    attributes: [],
    children: [],
  };
  consumeSpace(status);
  while (status.source[status.i] !== "}") {
    // HACK: Is it an attribute or a child block?
    let nextColon = status.source.indexOf(":", status.i);
    if (nextColon === -1) nextColon = status.source.length;
    let nextOpenBrace = status.source.indexOf("{", status.i);
    if (nextOpenBrace === -1) nextOpenBrace = status.source.length;
    if (nextColon < nextOpenBrace) {
      const attribute = parseStyleAttribute(status);
      block.attributes.push(attribute);
    } else if (nextOpenBrace < nextColon) {
      const child = parseStyleBlock(status);
      block.children.push(child);
    }
    consumeSpace(status);
  }
  accept("}", status);
  return block;
}

function parseStyleAttribute(status: ParseStatus): Attribute {
  const name = consumeUntil(":", status).trim();
  accept(":", status);
  const value = consumeUntil(";", status).trim();
  accept(";", status);
  const attribute: Attribute = {
    name,
    value,
  };
  return attribute;
}
