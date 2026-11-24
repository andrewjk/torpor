import devContext from "../dev/devContext";
import type Component from "../types/Component";
import type Region from "../types/Region";
import type SlotRender from "../types/SlotRender";
import isServerComponent from "./isServerComponent";
import clearRegion from "./clearRegion";
import context from "./context";
import newRegion from "./newRegion";
import pushRegion from "./pushRegion";
import { registerRegionTree, unregisterRegionTree } from "./regionTreeRegistry";

/**
 * Mounts a component into a DOM node
 *
 * The parent should be connected to the document: delegated events (click,
 * input, keydown, ...) are handled by a single listener per event type on
 * `document`, so events raised inside a detached container never reach their
 * handlers. (`hydrate` mounts into server-rendered markup, which is already
 * connected.)
 *
 * When a root region is already live (an embed mounting into an element
 * inside a mounted page), the component mounts against a region tree of its
 * own and the surrounding render context is left untouched — so tearing the
 * embed down later (`unmount(parent)`) disposes only the embed.
 *
 * @param parent The node to mount into. Like `hydrate`, it must have no
 * child elements
 * @param component The component to mount
 * @param props An object containing component props
 * @param slots Slot render functions for the component
 * @param rootContext The root `$context`, which the component and all of its
 *   descendants inherit (e.g. app-wide state that a framework provides to
 *   every page)
 */
export default function mount(
	parent: ParentNode,
	component: Component,
	props?: Record<string, any>,
	slots?: Record<string, SlotRender>,
	rootContext?: Record<PropertyKey, any>,
): void {
	if (isServerComponent(component)) {
		throw new Error(
			"The component was compiled for SSR (it renders to an HTML string) and cannot be mounted in the browser. Import the client build instead, e.g. with the '?client' import query",
		);
	}

	// The parent node must have no child elements, so that we can hydrate
	// without worrying about where to start
	if (parent.childElementCount > 0) {
		throw new Error("The parent node must have no child elements");
	}

	// Remove all text, commments, etc
	while (parent.firstChild !== null) {
		parent.firstChild.remove();
	}

	// Remember the surrounding render context, if any, so the component can
	// mount into a tree of its own and the host's context can be restored
	const nested = context.rootRegion !== null;
	const saved = nested
		? {
				activeRegion: context.activeRegion,
				previousRegion: context.previousRegion,
				rootRegion: context.rootRegion,
			}
		: null;

	// Create and push the root region
	const root = newRegion(devContext.enabled ? "Root" : undefined);
	context.rootRegion = root;
	context.previousRegion = root;
	pushRegion(root);

	// Call the component's render function. A throwing render must not leave
	// the render context (or the region registry) pointing at a half-built
	// tree: restore the pre-mount context and dispose the partial tree.
	let mounted = false;
	try {
		component(parent, null, props, rootContext, slots);
		mounted = true;
	} finally {
		if (mounted) {
			if (saved !== null) {
				// Pop back to the host's render context; the embed keeps living in
				// its own tree, to be torn down by `unmount(parent)`.
				context.rootRegion = saved.rootRegion;
				context.previousRegion = saved.previousRegion;
				context.activeRegion = saved.activeRegion;
			}
		} else {
			unregisterRegionTree(parent);
			// Dispose effects the partial render created. Guarded: a render can
			// throw from anywhere, so the tree may be in an odd state — the
			// context restore below must still happen.
			try {
				clearRegion(root);
			} catch {
				// Nothing useful to do while unwinding the original error
			}
			context.rootRegion = (saved !== null ? saved.rootRegion : null) as unknown as Region;
			context.previousRegion = (saved !== null ? saved.previousRegion : null) as unknown as Region;
			context.activeRegion = (saved !== null ? saved.activeRegion : null) as unknown as Region;
		}
	}

	if (mounted) {
		registerRegionTree(parent, root);
	}
}
