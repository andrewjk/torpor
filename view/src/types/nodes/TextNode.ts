import Node from "./Node";

export default interface TextNode extends Node {
  type: "text" | "space";
  content: string;
}
