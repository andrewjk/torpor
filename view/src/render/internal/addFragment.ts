import context from "../../global/context";

export default function addFragment(
  fragment: DocumentFragment,
  parent: ParentNode,
  before?: HTMLElement,
) {
  // TODO: Ranges for components, so that we always have an activerange
  if (context.activeRange) {
    context.activeRange.startNode = fragment.firstChild;
    // TODO: Set this to null if it's the same as startNode to save memory
    context.activeRange.endNode = fragment.lastChild;
  }

  // HACK:
  let parent2 = before && before.parentNode ? before.parentNode : parent;
  parent2.insertBefore(fragment, before || null);
}
