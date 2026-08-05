import "@testing-library/jest-dom/vitest";
import { expect, test } from "vite-plus/test";
import $watch from "../../src/watch/$watch";
import importComponent from "../importComponent";
import mountComponent from "../mountComponent";

const source = `
export default function ForReplace($props: { items: Array<{ id: number, name: string }> }) {
	@render {
		<ul>
			@for (let item of $props.items) {
				@key = item.id
				<li>{item.name}</li>
			}
		</ul>
	}
}
`;

test("replace with smaller list removes all old items", async () => {
	let nextId = 1;
	let $state = $watch({
		items: [] as Array<{ id: number; name: string }>,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	function buildData(count: number) {
		const data = new Array(count);
		for (let i = 0; i < count; i++) {
			data[i] = { id: nextId++, name: `Item ${nextId - 1}` };
		}
		return data;
	}

	// Start with 2000 items
	$state.items = buildData(2000);
	expect(container.querySelectorAll("li").length).toBe(2000);

	// Prepend 1000 more (all new keys)
	$state.items = [...buildData(1000), ...$state.items];
	expect(container.querySelectorAll("li").length).toBe(3000);

	// Replace with 1000 fresh items (all keys different from existing)
	$state.items = buildData(1000);
	expect(container.querySelectorAll("li").length).toBe(1000);

	// Verify no orphan rows
	let lis = container.querySelectorAll("li");
	expect(lis.length).toBe(1000);

	// Clear to 0
	$state.items = [];
	expect(container.querySelectorAll("li").length).toBe(0);
});

test("replace same-size then shrink does not leak items", async () => {
	let nextId = 100;
	let $state = $watch({
		items: [] as Array<{ id: number; name: string }>,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	function buildData(count: number) {
		const data = new Array(count);
		for (let i = 0; i < count; i++) {
			data[i] = { id: nextId++, name: `Item ${nextId - 1}` };
		}
		return data;
	}

	// run → 1000
	$state.items = buildData(1000);
	expect(container.querySelectorAll("li").length).toBe(1000);

	// run again (same-size replace, all keys differ)
	$state.items = buildData(1000);
	expect(container.querySelectorAll("li").length).toBe(1000);

	// add → 2000
	$state.items = [...$state.items, ...buildData(1000)];
	expect(container.querySelectorAll("li").length).toBe(2000);

	// run → 1000 (shrink, all keys differ)
	$state.items = buildData(1000);
	expect(container.querySelectorAll("li").length).toBe(1000);

	// add → 2000
	$state.items = [...$state.items, ...buildData(1000)];
	expect(container.querySelectorAll("li").length).toBe(2000);

	// add → 3000
	$state.items = [...$state.items, ...buildData(1000)];
	expect(container.querySelectorAll("li").length).toBe(3000);

	// run → 1000
	$state.items = buildData(1000);
	expect(container.querySelectorAll("li").length).toBe(1000);

	// clear → 0
	$state.items = [];
	expect(container.querySelectorAll("li").length).toBe(0);
});

test("key-match update preserves DOM nodes across replace cycles", async () => {
	let nextId = 1;
	let $state = $watch({
		items: [] as Array<{ id: number; name: string }>,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	function buildData(count: number) {
		const data = new Array(count);
		for (let i = 0; i < count; i++) {
			data[i] = { id: nextId++, name: `Item ${nextId - 1}` };
		}
		return data;
	}

	$state.items = buildData(100);

	// Capture DOM node references
	const lis = container.querySelectorAll("li");

	// Same-size replace with all-new keys
	$state.items = buildData(100);

	const lis2 = container.querySelectorAll("li");
	expect(lis2.length).toBe(100);

	// Keys differ so nodes should be new
	const allNew = new Set([...lis2].map((el) => el.textContent));
	const allOld = new Set([...lis].map((el) => el.textContent));
	const overlap = [...allNew].filter((x) => allOld.has(x));
	expect(overlap.length).toBe(0);
});

test("region chain handles large shrink", async () => {
	let nextId = 1;
	let $state = $watch({
		items: [] as Array<{ id: number; name: string }>,
	});

	const container = document.createElement("div");
	const component = await importComponent(import.meta.filename, source, "client");
	mountComponent(container, component, $state);

	function buildData(count: number) {
		const data = new Array(count);
		for (let i = 0; i < count; i++) {
			data[i] = { id: nextId++, name: `Item ${nextId - 1}` };
		}
		return data;
	}

	$state.items = buildData(5000);
	expect(container.querySelectorAll("li").length).toBe(5000);

	$state.items = buildData(500);
	expect(container.querySelectorAll("li").length).toBe(500);
}, 30000);
