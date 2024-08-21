import Import from "./Import";
import Documentation from "./docs/Documentation";
import RootNode from "./nodes/RootNode";
import Style from "./styles/Style";

/**
 * The template for a component, consisting of parts like script, markup and styles
 */
export default interface ComponentTemplate {
  name?: string;
  docs?: Documentation;
  imports?: Import[];
  script?: string;
  markup?: RootNode;
  childComponents?: ComponentTemplate[];
  style?: Style;
  styleHash?: string;
  props?: string[];
  contextProps?: string[];
}
