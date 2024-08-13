import Import from "./Import";
import Documentation from "./docs/Documentation";
import ControlNode from "./nodes/ControlNode";
import Style from "./styles/Style";

export default interface ComponentParts {
  name?: string;
  docs?: Documentation;
  imports?: Import[];
  script?: string;
  template?: ControlNode;
  childComponents?: ComponentParts[];
  style?: Style;
  styleHash?: string;
  props?: string[];
  contexts?: string[];
}
