import Component from "../compile/types/Component";

export default function render(parent: Node, component: Component, props?: Object) {
  // Add an anchor element at the start of the component
  /*const anchor =*/ createAnchor(parent, null, `@comp ${component.name}`);

  // Call the component's render function
  component.render(parent, null, props);
}

/*export default*/ function createAnchor(parent: Node, nextSibling: Node | null, comment: string) {
  const anchor = document.createComment(comment);
  parent.insertBefore(anchor, nextSibling ?? null);
  return anchor;
}
