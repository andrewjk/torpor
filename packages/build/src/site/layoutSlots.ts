/**
 * Layouts are composed by the layout engine passing each layout (and finally
 * the page) as the default slot of its parent — so every `_layout` component
 * must render `<slot />`, or pass the default slot down to a child component
 * it renders. A layout that doesn't drops its entire content: the server
 * renders the layout's own markup with an empty content area (no error), and
 * the first client-side navigation that reuses the layout crashes on a null
 * slot region.
 *
 * The static `checkLayoutSlots` check catches this at build/dev time; these
 * helpers report it at request time for the cases static analysis can't see
 * (e.g. a `<slot />` rendered conditionally inside `@if`). They are
 * server-side only — nothing here is imported into the client bundle.
 */

/**
 * Returns the path of the outermost layout that never rendered its
 * `<slot />`, or undefined when every level rendered.
 *
 * Slot level j (1-based) is the slot render that layout j - 1 receives: the
 * root layout (layouts[0]) renders level 1, layout i renders level i + 1,
 * and level layouts.length renders the page. A broken level makes every
 * deeper level unreachable, so the first level that never ran identifies
 * the offending layout.
 */
export function findMissingSlotLayout(
	layouts: readonly { path: string }[],
	invokedLevels: ReadonlySet<number>,
): string | undefined {
	for (let level = 1; level <= layouts.length; level++) {
		if (!invokedLevels.has(level)) {
			return layouts[level - 1].path;
		}
	}
	return undefined;
}

const warnedLayouts = new Set<string>();

/**
 * Reports a layout that dropped its slot content. The condition is a genuine
 * rendering bug (the page content is missing from the output), so it is not
 * dev-gated — but it warns only once per layout path to avoid per-request
 * noise.
 */ export function warnMissingSlotContent(layoutPath: string): void {
	if (warnedLayouts.has(layoutPath)) return;
	warnedLayouts.add(layoutPath);
	console.warn(
		`[torpor] The layout at "${layoutPath}" never rendered <slot />, so the page content ` +
			`was not included in the render. Every _layout component must render <slot /> (or ` +
			`pass the default slot down to a child component it renders).`,
	);
}
