/**
 * Dev-only check for components whose `@head` titles compete: when two
 * mounted components set a `<title>`, the client shows the last one set, but
 * `@torpor/build`'s server keeps the first one it renders (the page's), so
 * the title changes as the page hydrates. A page's title over its layouts'
 * is fine (both pick the page's); anything else is usually a stray `@head`
 * in a child component.
 */

interface DevTitle {
	/** The depth of the layout slot the component rendered in, or -1. */
	slotDepth: number;
	value: string;
}

/** The titles currently set by mounted components. */
const titles = new Set<DevTitle>();

/**
 * The titles already warned about, so that a component used many times (or
 * on every page) is only reported once.
 */
const warned = new Set<string>();

/** The depth of the layout slot being rendered (see `fillLayoutSlot`). */
let slotDepth = -1;

/**
 * Sets the depth of the layout slot being rendered, returning the previous
 * one to restore. Called by `fillLayoutSlot` in dev mode.
 */
export function setDevSlotDepth(depth: number): number {
	const previous = slotDepth;
	slotDepth = depth;
	return previous;
}

/**
 * Tracks a component's `@head` title, from the code generated for dev
 * builds. Call at render time, then `set` and `unset` from the title's
 * effect.
 */
export default function devTitle(): { set: (value: string) => void; unset: () => void } {
	const title: DevTitle = { slotDepth, value: "" };
	return {
		set(value) {
			title.value = value;
			if (!warned.has(value)) {
				// Only a title rendered in a deeper layout slot than all the
				// others (a page over its layouts) shows the same on both sides
				const others = new Set(
					[...titles]
						.filter((t) => t.slotDepth >= title.slotDepth && t.value !== value)
						.map((t) => JSON.stringify(t.value)),
				);
				if (others.size > 0) {
					warned.add(value);
					console.warn(
						`[torpor] More than one mounted component sets the page title: ` +
							`${[...others].join(", ")} and ${JSON.stringify(value)}. The server ` +
							`keeps the page's title but the client shows the last one set, so the ` +
							`title changes as the page hydrates. Remove the <title> from the ` +
							`@head of the component that shouldn't set it (e.g. a shared child ` +
							`component).`,
					);
				}
			}
			titles.add(title);
		},
		unset() {
			titles.delete(title);
		},
	};
}
