import context from "../../global/context";

export default function addFragment(
  fragment: DocumentFragment,
  parent: ParentNode,
  before?: HTMLElement,
) {
  // TODO: Ranges for components, so that we always have an activerange
  const range = context.activeRange;
  if (range) {
    range.startNode = fragment.firstChild;
    const endNode = fragment.lastChild;
    range.endNode = endNode !== range.startNode ? endNode : null;
  }

  // HACK:
  let parent2 = before && before.parentNode ? before.parentNode : parent;
  parent2.insertBefore(fragment, before || null);
}
