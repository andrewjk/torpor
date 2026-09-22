import type ListItemSpec from "../types/ListItemSpec";
import type Region from "../types/Region";

// Warn once per (list region, key value), so a list that re-renders on every
// keystroke doesn't flood the console. Keyed by region identity because a
// region is stable for the lifetime of one `@for` instance.
const warnedByRegion = new WeakMap<Region, Set<unknown>>();

/**
 * DEV-ONLY: warns when a keyed `@for` list contains duplicate `@key` values.
 *
 * `runListItems` matches old and new rows by key (first match wins), so
 * duplicate keys make updates and removals hit the wrong rows, desyncing the
 * DOM from the data. Called from `runList` only when `devContext.enabled`, so
 * it never runs in a production build.
 *
 * `undefined`/`null` keys are the "unkeyed" case (rows are matched
 * positionally) and are ignored.
 *
 * @param region The `@for` list's region, used to dedupe warnings per list.
 * @param specs The new row specs, in order.
 */
export default function checkListKeys(region: Region, specs: ListItemSpec[]): void {
	let seen: Set<unknown> | undefined;
	for (let i = 0; i < specs.length; i++) {
		const key = specs[i]!.key;
		if (key === undefined || key === null) continue;

		if (seen === undefined) seen = new Set();
		if (!seen.has(key)) {
			seen.add(key);
			continue;
		}

		let warned = warnedByRegion.get(region);
		if (warned === undefined) {
			warned = new Set();
			warnedByRegion.set(region, warned);
		}
		if (!warned.has(key)) {
			warned.add(key);
			console.warn(
				`[torpor] Duplicate @key value ${formatKey(key)} in a keyed @for list. ` +
					"Keys must be unique, or updates and removals will affect the wrong rows.",
			);
		}
	}
}

function formatKey(key: unknown): string {
	try {
		const json = JSON.stringify(key);
		return json === undefined ? String(key) : json;
	} catch {
		return String(key);
	}
}
