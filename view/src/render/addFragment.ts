import $run from "../$run";
import animate from "../motion/animate";
import context from "./context";

export default function addFragment(
	fragment: DocumentFragment,
	parent: ParentNode,
	before: Node | null,
) {
	//console.log(`adding fragment '${fragment.textContent}' to ${printNode(parent)}`);
	//console.log("before", printNode(before));

	// Set the active range's end node to the last node in the fragment
	const range = context.activeRange;
	if (range) {
		if (context.hydrationNode) {
			range.endNode = context.hydrationNode as ChildNode;
		} else {
			range.endNode = fragment.lastChild;
		}
	}

	let parentIsFragment = parent.nodeType === 11;

	if (!context.hydrationNode) {
		// HACK: We need to be able to add fragments to new fragments as well as
		// fragments that have already been added to the document. New fragments will
		// be ok, but fragments that have been added will not be parents of the before
		// element (because it's now in the document). In this case we will have to
		// use the before element's parent, which should work as long as we are always
		// passing a before element...
		if (parentIsFragment) {
			parent = before!.parentNode!;
		}

		// Add the fragment
		parent.insertBefore(fragment, before);
	}

	// If we're adding this fragment to the DOM, we can now add our stashed
	// events and play our stashed animations
	if (!parentIsFragment) {
		let oldRange = context.activeRange;

		for (let event of context.stashedEvents) {
			context.activeRange = event.range;
			$run(() => {
				event.el.addEventListener(event.type, event.listener);
				return () => {
					event.el.removeEventListener(event.type, event.listener);
				};
			});
		}
		context.stashedEvents.length = 0;

		for (let animation of context.stashedAnimations) {
			context.activeRange = animation.range;
			$run(() => {
				animate(animation.el, true, animation.inKeyframes, animation.inOptions);
				if (animation.outKeyframes) {
					return () => {
						animate(animation.el, false, animation.outKeyframes, animation.outOptions);
					};
				}
			});
		}
		context.stashedAnimations.length = 0;

		context.activeRange = oldRange;
	}
}
