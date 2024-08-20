import type Component from "../compile/types/Component";
import context from "../global/context";

export default function hydrate(parent: Node, component: Component, props?: Object) {
  // When mounting, the parent must have no child elements, so  we can just set
  // the hydration node to the first child node
  context.hydrationNode = parent.firstChild;

  // Call the component's render function
  component.render(parent, null, props);

  context.hydrationNode = null;
}
