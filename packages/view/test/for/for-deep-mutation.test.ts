import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// A deep-watched list whose items are replaced by reference but never
// mutated in place by the ops — and then mutated in place by hand. This pins
// the interaction between the reconciler's no-op update skip (survivors with
// a reference-equal data bag skip the compiler-emitted update call) and the
// deep proxies' per-property signals (in-place mutations of a survivor's
// children must still repaint, through the item's own cached proxy).
const source = `
export default function ForDeepMutation($props: { items: Array<{ label: string }> }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				@key = item.label
				<li>{item.label}</li>
			}
		</ul>
	}
}
`;

function getLabels(container: HTMLElement): string[] {
	return Array.from(container.querySelectorAll("li")).map((li) => li.textContent?.trim() || "");
}

test("deep for repaints in-place child mutations across no-op update skips", async () => {
	let $state = $watch({
		items: [{ label: "one" }, { label: "two" }, { label: "three" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect(getLabels(container)).toEqual(["one", "two", "three"]);

	// In-place mutation of a child property: the item reference never
	// changes and the list effect doesn't re-run — the row repaints through
	// the item proxy's own tracked `label` signal.
	$state.items[1].label = "MUTATED";
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED", "three"]);

	// Reassign a NEW array holding the same item objects: the list effect
	// re-runs, the reconciler matches all survivors by key, and the
	// reference-equal data bags skip the update call (the deep proxy cache
	// returns the same proxy for the same target, so `item.data ===
	// spec.data`). The DOM must stay correct.
	$state.items = [...$state.items];
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED", "three"]);
	expect(container.querySelectorAll("li").length).toBe(3);

	// In-place mutation again AFTER the skip-carrying reconciliation: the
	// per-property signal on the cached item proxy must still be wired to
	// the row effect.
	$state.items[1].label = "MUTATED AGAIN";
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED AGAIN", "three"]);

	// Append: a new item mounts under a fresh key; survivors untouched.
	$state.items.push({ label: "four" });
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED AGAIN", "three", "four"]);
});

test("deep for repaints in-place child mutations -- hydrated", async () => {
	let $state = $watch({
		items: [{ label: "one" }, { label: "two" }, { label: "three" }],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	await hydrateComponent(container, clientComponent, serverComponent, $state);

	expect(getLabels(container)).toEqual(["one", "two", "three"]);

	$state.items[1].label = "MUTATED";
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED", "three"]);

	$state.items = [...$state.items];
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED", "three"]);

	$state.items[1].label = "MUTATED AGAIN";
	await Promise.resolve();
	expect(getLabels(container)).toEqual(["one", "MUTATED AGAIN", "three"]);
});
