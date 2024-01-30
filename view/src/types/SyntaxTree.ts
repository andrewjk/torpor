import ElementNode from "../nodes/ElementNode";
import Import from "./Import";

export default interface SyntaxTree {
  imports?: Import[];
  script?: string;
  template?: ElementNode;
  style?: string;
}
