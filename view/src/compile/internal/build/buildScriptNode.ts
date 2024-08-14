import type ControlNode from "../../types/nodes/ControlNode";
import { maybeAppend } from "../utils";
import Builder from "./Builder";

export default function buildScriptNode(node: ControlNode, b: Builder) {
  b.append(`/* ${node.operation} */`);
  b.append(`${maybeAppend(node.statement, ";")}`);
}
