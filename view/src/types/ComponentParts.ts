import Import from "./Import";
import Documentation from "./docs/Documentation";
import ElementNode from "./nodes/ElementNode";
import Style from "./styles/Style";

export default interface ComponentParts {
  docs?: Documentation;
  imports?: Import[];
  script?: string;
  template?: ElementNode;
  style?: Style;
  styleHash?: string;
  props?: string[];
}
