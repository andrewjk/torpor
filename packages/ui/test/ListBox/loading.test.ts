import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount, $watch } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import ListBoxLoader from "./components/ListBoxLoader.torp";

const tick = () => new Promise((r) => setTimeout(r));

interface DeferredLoader {
	load: (request: any) => Promise<any>;
	requests: any[];
	resolveNext: (result?: any) => void;
}

function createDeferredLoader(): DeferredLoader {
	const requests: any[] = [];
	const resolvers: ((result: any) => void)[] = [];
	return {
		requests,
		load: (request: any) =>
			new Promise<any>((resolve, reject) => {
				requests.push(request);
				resolvers.push((result: any) => {
					if (result instanceof Error) reject(result);
					else resolve(result ?? { items: [] });
				});
			}),
		resolveNext: (result?: any) => {
			resolvers.shift()!(result ?? { items: [] });
		},
	};
}

describe("ListBox - loading options from a loader", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("shows a loading state, then the loaded options", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxLoader as any, { load: loader.load });

		expect(within(container).getByRole("status")).toHaveTextContent("Loading…");

		loader.resolveNext({
			items: [
				{ id: 1, label: "Cat" },
				{ id: 2, label: "Dog" },
			],
		});
		await tick();

		expect(within(container).getByRole("option", { name: "Cat" })).toBeInTheDocument();
		expect(within(container).getByRole("option", { name: "Dog" })).toBeInTheDocument();
	});

	it("selects a loaded option", async () => {
		const onchange = vi.fn();
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxLoader as any, { load: loader.load, onchange });

		loader.resolveNext({
			items: [
				{ id: "a", label: "Cat" },
				{ id: "b", label: "Dog" },
			],
		});
		await tick();

		fireEvent.click(within(container).getByRole("option", { name: "Dog" }));
		await tick();
		expect(onchange).toHaveBeenCalledWith("b");
	});

	it("refetches when the searchText binding changes", async () => {
		const loader = createDeferredLoader();
		const searchTextState = $watch({ v: undefined as string | undefined });
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxLoader as any, { load: loader.load, searchTextState });

		loader.resolveNext({ items: [{ id: 1, label: "All" }] });
		await tick();
		expect(loader.requests[0]).toEqual({ searchText: undefined });

		// The consumer updates the bound value
		searchTextState.v = "do";
		await tick();
		await tick();

		expect(loader.requests.at(-1)).toEqual({ searchText: "do" });
		loader.resolveNext({ items: [{ id: 2, label: "Dog" }] });
		await tick();
		expect(within(container).getByRole("option", { name: "Dog" })).toBeInTheDocument();
	});

	it("shows the error message when the load fails", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxLoader as any, { load: loader.load });

		loader.resolveNext(new Error("Network down"));
		await tick();

		expect(within(container).getByRole("alert")).toHaveTextContent("Network down");
	});

	it("uses getItemLabel and getItemValue", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxLoader as any, {
			load: loader.load,
			getItemLabel: (p: any) => p.name.toUpperCase(),
			getItemValue: (p: any) => p.key,
		});

		loader.resolveNext({ items: [{ key: "k1", name: "cat" }] });
		await tick();

		expect(within(container).getByRole("option", { name: "CAT" })).toBeInTheDocument();
	});

	it("slotted items take precedence over the loader", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ListBoxLoader as any, {
			load: loader.load,
			slotItems: true,
		});

		loader.resolveNext({ items: [{ id: 1, label: "Loaded" }] });
		await tick();

		// The loader never runs because real content was slotted in
		expect(loader.requests.length).toBe(0);
		expect(within(container).getByRole("option", { name: "Slotted" })).toBeInTheDocument();
	});
});
