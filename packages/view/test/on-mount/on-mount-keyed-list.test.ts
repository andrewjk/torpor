import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import hydrateComponent from "../hydrateComponent";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

// Mount effects must fire ONCE per row lifetime, not on every keyed-list
// update. When the keyed reconciler reuses a row (same key, new data), it
// force re-runs the row's effects via `rerunEffectsOnRegion` — which must
// skip the `$onmount`/`onmount`-backed effects, or `onmount` would re-fire on
// every update and mis-count row creations.
const source = `
export default function MountEffectList($props: { items: Array<{ id: number; value: string }> }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				@key = item.id
				<li class="row" onmount={() => window.__mounts++}>{item.value}</li>
			}
		</ul>
	}
}
`;

test("onmount fires once per row lifetime on keyed update", async () => {
	(window as any).__mounts = 0;
	const $state = $watch({
		items: [
			{ id: 1, value: "a" },
			{ id: 2, value: "b" },
		],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect((window as any).__mounts).toBe(2);
	const firstRow = container.querySelectorAll(".row")[0];

	// Replace with same-id items: rows must be reused (same DOM node), text
	// updated, and onmount must NOT re-fire.
	$state.items = [
		{ id: 1, value: "c" },
		{ id: 2, value: "d" },
	];

	expect(container.querySelectorAll(".row")[0]).toBe(firstRow);
	expect((window as any).__mounts).toBe(2);
	expect(container.textContent).toContain("c");
});

test("onmount fires once per row lifetime on keyed update -- hydrated", async () => {
	(window as any).__mounts = 0;
	const $state = $watch({
		items: [
			{ id: 1, value: "a" },
			{ id: 2, value: "b" },
		],
	});

	const container = document.createElement("div");
	const clientComponent = await importComponent(import.meta.filename, source, "client");
	const serverComponent = await importComponent(import.meta.filename, source, "server");
	hydrateComponent(container, clientComponent, serverComponent, $state);

	$state.items = [
		{ id: 1, value: "c" },
		{ id: 2, value: "d" },
	];

	expect((window as any).__mounts).toBe(2);
	expect(container.textContent).toContain("c");
});

test("onmount fires again for genuinely new rows", async () => {
	(window as any).__mounts = 0;
	const $state = $watch({
		items: [{ id: 1, value: "a" }],
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	expect((window as any).__mounts).toBe(1);

	// Append a genuinely new key — that row's onmount must fire.
	$state.items = [
		{ id: 1, value: "a" },
		{ id: 2, value: "b" },
	];

	expect((window as any).__mounts).toBe(2);
});
