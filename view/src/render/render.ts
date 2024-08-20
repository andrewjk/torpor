import type Component from "../compile/types/Component";

// TODO: Should we have ClientComponent and ServerComponent types?

export default function render(parent: ParentNode, component: Component, props?: Object) {
  // The parent must have no child elements, so that we can hydrate without
  // worrying about where to start
  if (parent.childElementCount) {
    throw new Error("The mounting parent node must have no child elements");
  }

  // Remove all text, commments, etc
  while (parent.firstChild) {
    parent.firstChild.remove();
  }

  // Call the component's render function
  component.render(parent, null, props);
}
