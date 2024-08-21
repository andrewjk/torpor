import Import from "./Import";
import Documentation from "./docs/Documentation";
import RootNode from "./nodes/RootNode";
import Style from "./styles/Style";

export default interface ComponentParts {
  name?: string;
  docs?: Documentation;
  imports?: Import[];
  script?: string;
  template?: RootNode;
  childComponents?: ComponentParts[];
  style?: Style;
  styleHash?: string;
  props?: string[];
  contexts?: string[];
}
