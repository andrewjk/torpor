import ElementNode from "../nodes/ElementNode";
import Documentation from "./Documentation";
import Import from "./Import";
import Style from "./Style";

export default interface ComponentParts {
  docs?: Documentation;
  imports?: Import[];
  script?: string;
  template?: ElementNode;
  style?: Style;
  styleHash?: string;
}
