import Component from "../types/Component";

export default function render(parent: Node, component: Component, anchor: Node | null) {
  // Add an anchor element at the start of the component
  anchor = createAnchor(parent, anchor && anchor.nextSibling, `#comp ${component.name}`);

  // Call the component's render function
  component.render(parent, anchor);
}

/*export default*/ function createAnchor(parent: Node, nextSibling: Node | null, comment: string) {
  const anchor = document.createComment(comment);
  parent.insertBefore(anchor, nextSibling ?? null);
  return anchor;
}
