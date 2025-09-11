import animate from "../motion/animate";
import $run from "./$run";
import context from "./context";
import isFragmentNode from "./isFragmentNode";

export default function addFragment(
	fragment: DocumentFragment,
	parent: ParentNode,
	before: Node | null,
	endNode?: ChildNode,
): void {
	//console.log(`adding fragment '${fragment.textContent}' to `, parent);
	//console.log("before", before);

	const range = context.activeRange;
	const hydrationNode = context.hydrationNode;

	// Set the active range's end node to the last node in the fragment
	if (range) {
		if (hydrationNode) {
			range.endNode = endNode ?? hydrationNode;
		} else {
			range.startNode = fragment.firstChild;
			range.endNode = fragment.lastChild;
		}
	}

	let parentIsFragment = isFragmentNode(parent);

	if (!hydrationNode) {
		// HACK: We need to be able to add fragments to new fragments as well as
		// fragments that have already been added to the document. New fragments will
		// be ok, but fragments that have been added will not be parents of the before
		// element (because it's now in the document). In this case we will have to
		// use the before element's parent, which should work as long as we are always
		// passing a before element...
		if (parentIsFragment) {
			parent = before!.parentNode!;
			parentIsFragment = isFragmentNode(parent);
		}

		// Add the fragment
		parent.insertBefore(fragment, before);
	}

	// If we're adding this fragment to the DOM, we can now run any $mount
	// effects, add our stashed events and play our stashed animations
	if (!parentIsFragment) {
		// Only run $mount effects if not hydrating (if hydrating, they will get
		// run at the end when everything is hooked up)
		if (!hydrationNode) {
			for (let effect of context.mountEffects) {
				$run(effect);
			}
			context.mountEffects.length = 0;
		}

		// Set the active range for each event so it will get attached to the
		// right one and set it back afterwards
		for (let event of context.stashedEvents) {
			context.activeRange = event.range;
			$run(function addFragmentEvent() {
				event.el.addEventListener(event.type, event.listener);
				return () => {
					event.el.removeEventListener(event.type, event.listener);
				};
			});
		}
		context.stashedEvents.length = 0;

		// Set the active range for each animation so it will get attached to
		// the right one and set it back afterwards
		for (let animation of context.stashedAnimations) {
			context.activeRange = animation.range;
			$run(function addFragmentAnimation() {
				if (animation.in) {
					animate(animation.el, true, animation.in.keyframes, animation.in.options);
				}
				if (animation.out) {
					return () => {
						animate(animation.el, false, animation.out!.keyframes, animation.out!.options);
					};
				}
			});
		}
		context.stashedAnimations.length = 0;

		// Set the active range back
		context.activeRange = range;
	}
}
