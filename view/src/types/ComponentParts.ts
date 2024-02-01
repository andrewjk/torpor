import ElementNode from "../nodes/ElementNode";
import Import from "./Import";
import Style from "./Style";

export default interface ComponentParts {
  imports?: Import[];
  script?: string;
  template?: ElementNode;
  style?: Style;
  styleHash?: string;
}
