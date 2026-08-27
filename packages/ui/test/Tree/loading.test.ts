import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import ItemLoaderTree from "./components/ItemLoaderTree.torp";
import LoaderTree from "./components/LoaderTree.torp";

const tick = () => new Promise((r) => setTimeout(r));

interface DeferredLoader {
	load: (request: any) => Promise<any>;
	requests: any[];
	resolveNext: (result?: any) => void;
}

/** Creates a loader whose results are resolved manually by the test */
function createDeferredLoader(): DeferredLoader {
	const requests: any[] = [];
	const resolvers: ((result: any) => void)[] = [];
	return {
		requests,
		load: (request: any) =>
			new Promise<any>((resolve, reject) => {
				requests.push(request);
				resolvers.push((result: any) => {
					if (result instanceof Error) {
						reject(result);
					} else {
						resolve(result ?? { items: [] });
					}
				});
			}),
		resolveNext: (result?: any) => {
			resolvers.shift()!(result ?? { items: [] });
		},
	};
}

function getTrigger(container: HTMLElement): HTMLElement {
	// The trigger is aria-hidden; click it directly
	return container.querySelector("button.torp-tree-item-trigger")!;
}

function getExpandableTrigger(container: HTMLElement): HTMLElement {
	return container.querySelector('button[aria-hidden="true"]')!;
}

describe("Tree - Loading children from a network loader", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("shows a loading state, then the loaded children", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load });

		// Nothing loaded yet: children region renders nothing
		expect(queryByText(container, "Loading…")).not.toBeInTheDocument();

		await userEvent.click(getExpandableTrigger(container));
		expect(queryByText(container, "Loading…")).toBeInTheDocument();
		expect(deferred.requests).toEqual([{ item: "root" }]);

		deferred.resolveNext({
			items: [
				{ id: 1, label: "Child A" },
				{ id: 2, label: "Child B" },
			],
		});
		await tick();

		expect(queryByText(container, "Loading…")).not.toBeInTheDocument();
		expect(queryByText(container, "Child A")).toBeInTheDocument();
		expect(queryByText(container, "Child B")).toBeInTheDocument();
	});

	it("does not load until the item is expanded", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load });

		expect(deferred.requests.length).toBe(0);

		await userEvent.click(getExpandableTrigger(container));
		deferred.resolveNext({ items: [{ id: 1, label: "Child A" }] });
		await tick();
		expect(deferred.requests.length).toBe(1);

		// Collapse and expand again: no additional fetch
		await userEvent.click(getTrigger(container));
		await userEvent.click(getTrigger(container));
		await tick();
		expect(deferred.requests.length).toBe(1);
		expect(queryByText(container, "Child A")).toBeInTheDocument();
	});

	it("renders loaded items as selectable tree items that update the value", async () => {
		const deferred = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load, onchange });

		await userEvent.click(getExpandableTrigger(container));
		deferred.resolveNext({
			items: [
				{ id: "a", label: "Child A" },
				{ id: "b", label: "Child B" },
			],
		});
		await tick();

		await userEvent.click(queryByText(container, "Child B")!);
		expect(onchange).toHaveBeenCalledWith("b");
	});

	it("loads grandchildren lazily when a loaded item declares hasChildren", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load });

		await userEvent.click(getExpandableTrigger(container));
		deferred.resolveNext({
			items: [{ id: "branch", label: "Branch", hasChildren: true }],
		});
		await tick();

		// The loaded item shows an expand trigger of its own
		const triggers = container.querySelectorAll("button.torp-tree-item-trigger");
		expect(triggers.length).toBe(2);
		expect(deferred.requests.length).toBe(1);

		await userEvent.click(triggers[1]);
		expect(deferred.requests.at(-1)).toEqual({ item: "branch" });
		expect(queryByText(container, "Loading…")).toBeInTheDocument();

		deferred.resolveNext({ items: [{ id: "leaf", label: "Leaf" }] });
		await tick();
		expect(queryByText(container, "Leaf")).toBeInTheDocument();
	});

	it("calls onload with the result and the parent item's value", async () => {
		const deferred = createDeferredLoader();
		const onload = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load, onload });

		await userEvent.click(getExpandableTrigger(container));

		// Bare array loaders are normalized into { items }
		deferred.resolveNext([{ id: 1, label: "Child A" }] as any);
		await tick();

		expect(onload).toHaveBeenCalledWith({ items: [{ id: 1, label: "Child A" }] }, "root");
	});

	it("uses getItemLabel and getItemValue when rendering loaded children", async () => {
		const deferred = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, {
			load: deferred.load,
			getItemLabel: (p: any) => p.name.toUpperCase(),
			getItemValue: (p: any) => p.key,
			onchange,
		});

		await userEvent.click(getExpandableTrigger(container));
		deferred.resolveNext({
			items: [
				{ key: "k1", name: "cat" },
				{ key: "k2", name: "dog" },
			],
		});
		await tick();

		expect(queryByText(container, "CAT")).toBeInTheDocument();

		await userEvent.click(queryByText(container, "CAT")!);
		expect(onchange).toHaveBeenCalledWith("k1");
	});

	it("shows the error message when the load fails", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load });

		await userEvent.click(getExpandableTrigger(container));
		deferred.resolveNext(new Error("Network down"));
		await tick();

		expect(queryByText(container, "Network down")).toBeInTheDocument();
		expect(queryByText(container, "Loading…")).not.toBeInTheDocument();
	});

	it("shows a message when a folder loads with no children", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderTree as any, { load: deferred.load });

		await userEvent.click(getExpandableTrigger(container));
		deferred.resolveNext({ items: [] });
		await tick();

		expect(queryByText(container, "No items.")).toBeInTheDocument();
	});

	it("throws when an item declares hasChildren but there is no loader", () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(() => {
				const container = document.createElement("div");
				document.body.appendChild(container);
				mount(container, LoaderTree as any, {});
			}).toThrow(/requires a `load` function/);
		} finally {
			consoleError.mockRestore();
		}
	});
});

describe("Tree - Per-item loader", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("prefers the item's own load function over the tree's", async () => {
		const treeLoader = createDeferredLoader();
		const itemLoader = createDeferredLoader();
		const onload = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ItemLoaderTree as any, {
			load: treeLoader.load,
			itemLoad: itemLoader.load,
			onload,
		});

		await userEvent.click(getExpandableTrigger(container));
		itemLoader.resolveNext({ items: [{ id: 1, label: "From Item" }] });
		await tick();

		expect(itemLoader.requests.length).toBe(1);
		expect(treeLoader.requests.length).toBe(0);
		expect(queryByText(container, "From Item")).toBeInTheDocument();
		expect(onload).toHaveBeenCalledWith({ items: [{ id: 1, label: "From Item" }] }, "root");
	});
});
