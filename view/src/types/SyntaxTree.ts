import ElementNode from "../nodes/ElementNode";

export default interface SyntaxTree {
  imports?: string[];
  script?: string;
  template?: ElementNode;
  style?: string;
}
