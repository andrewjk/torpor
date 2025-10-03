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
	if (hydrationNode !== null) {
		range.endNode = endNode ?? hydrationNode;
	} else {
		range.startNode = fragment.firstChild;
		range.endNode = fragment.lastChild;
	}

	parent = before?.parentNode ?? parent;

	// Add the fragment
	if (hydrationNode === null) {
		parent.insertBefore(fragment, before);
	}

	// If we're adding this fragment to the DOM, we can now run any $mount
	// effects, add our stashed events and play our stashed animations
	if (!isFragmentNode(parent)) {
		// Only run $mount effects if not hydrating (if hydrating, they will get
		// run at the end when everything is hooked up)
		if (hydrationNode === null) {
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
		// Don't await animations
		for (let animation of context.stashedAnimations) {
			context.activeRange = animation.range;
			$run(function addFragmentAnimation() {
				if (animation.in !== undefined) {
					// eslint-disable-next-line no-floating-promises
					animate(animation.el, true, animation.in.keyframes, animation.in.options);
				}
				if (animation.out !== undefined) {
					return () => {
						// eslint-disable-next-line no-floating-promises
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
