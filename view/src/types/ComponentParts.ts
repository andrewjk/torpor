import Import from "./Import";
import Documentation from "./docs/Documentation";
import ElementNode from "./nodes/ElementNode";
import Style from "./styles/Style";

export default interface ComponentParts {
  name?: string;
  docs?: Documentation;
  imports?: Import[];
  script?: string;
  template?: ElementNode;
  childComponents?: ComponentParts[];
  style?: Style;
  styleHash?: string;
  props?: string[];
  contexts?: string[];
}
