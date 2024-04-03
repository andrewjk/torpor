import context from "../../global/context";

export default function addFragment(
  fragment: DocumentFragment,
  parent: ParentNode,
  before?: HTMLElement,
) {
  const startNode = fragment.childNodes[0];
  const endNode = fragment.childNodes[fragment.childNodes.length - 1];

  // TODO: Ranges for components, so that we always have an activerange
  if (context.activeRange) {
    context.activeRange.startNode = startNode;
    context.activeRange.endNode = endNode;
  }

  // HACK:
  let parent2 = before && before.parentNode ? before.parentNode : parent;
  parent2.insertBefore(fragment, before || null);
}
