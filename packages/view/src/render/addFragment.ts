import $run from "../watch/$run";
import animate from "./animate";
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

	const activeRegion = context.activeRegion;
	const hydrationNode = context.hydrationNode;

	// Set the active region's end node to the last node in the fragment
	if (hydrationNode !== null) {
		activeRegion.endNode = endNode ?? hydrationNode;
	} else {
		activeRegion.startNode = fragment.firstChild;
		activeRegion.endNode = fragment.lastChild;
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

		// Set the active region for each event so it will get attached to the
		// right one and set it back afterwards
		if (context.stashedEvents.length > 0) {
			const events = [...context.stashedEvents];
			$run(function addFragmentEvents() {
				for (let event of events) {
					event.el.addEventListener(event.type, event.listener);
				}
				return () => {
					for (let event of events) {
						event.el.removeEventListener(event.type, event.listener);
					}
				};
			});
			context.stashedEvents.length = 0;
		}

		// Set the active region for each animation so it will get attached to
		// the right one and set it back afterwards
		// Don't await animations
		for (let animation of context.stashedAnimations) {
			context.activeRegion = animation.region;
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

		// Set the active region back
		context.activeRegion = activeRegion;
	}
}
