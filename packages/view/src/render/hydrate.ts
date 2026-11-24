import devContext from "../dev/devContext";
import type Component from "../types/Component";
import type SlotRender from "../types/SlotRender";
import flushMountEffects from "../watch/flushMountEffects";
import isServerComponent from "./isServerComponent";
import context from "./context";
import newRegion from "./newRegion";
import pushRegion from "./pushRegion";
import { registerRegionTree } from "./regionTreeRegistry";

/**
 * Hydrates a component into an existing DOM tree
 *
 * When a root region is already live (an embed hydrating its server-rendered
 * markup inside a mounted page), the component hydrates against a region
 * tree of its own and the surrounding render context is restored afterwards
 * — hydration must not replace the host's `rootRegion`/`previousRegion`.
 * Tearing the embed down later (`unmount(parent)`) then disposes only the
 * embed's tree.
 *
 * @param parent The parent node
 * @param component The component to mount
 * @param props An object containing component props
 * @param slots Slot render functions for the component
 * @param rootContext The root `$context`, which the component and all of its
 *   descendants inherit (e.g. app-wide state that a framework provides to
 *   every page)
 */
export default function hydrate(
	parent: ParentNode,
	component: Component,
	props?: Record<string, any>,
	slots?: Record<string, SlotRender>,
	rootContext?: Record<PropertyKey, any>,
): void {
	if (isServerComponent(component)) {
		throw new Error(
			"The component was compiled for SSR (it renders to an HTML string) and cannot be hydrated in the browser. Import the client build instead, e.g. with the '?client' import query",
		);
	}

	// Remember the surrounding render context, if any, so it can be restored
	// once hydration is done
	const nested = context.rootRegion !== null;
	const saved = nested
		? {
				activeRegion: context.activeRegion,
				hydrationNode: context.hydrationNode,
				previousRegion: context.previousRegion,
				rootRegion: context.rootRegion,
			}
		: null;

	// When mounting, the parent must have no child elements, so  we can just set
	// the hydration node to the first child node
	context.hydrationNode = parent.firstChild;

	// Create and push the root region
	// TODO: Does it need to be on context??
	const root = newRegion(devContext.enabled ? "Root" : undefined);
	context.rootRegion = root;
	context.previousRegion = root;
	pushRegion(root);

	// Call the component's render function
	component(parent, null, props, rootContext, slots);

	context.hydrationNode = null;

	// Now that we've hydrated, we can run $onmount effects
	flushMountEffects();

	if (saved === null) {
		registerRegionTree(parent, root);
		return;
	}

	// Pop back to the host's render context; the embed keeps living in its
	// own tree, to be torn down by `unmount(parent)`.
	context.hydrationNode = saved.hydrationNode;
	context.rootRegion = saved.rootRegion;
	context.previousRegion = saved.previousRegion;
	context.activeRegion = saved.activeRegion;
	registerRegionTree(parent, root);
}
