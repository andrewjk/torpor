import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { LoadResult } from "../../../src/ComboBox/index";
import LoaderComboBox from "./components/LoaderComboBox.torp";

const tick = () => new Promise((r) => setTimeout(r));

interface DeferredLoader {
	load: (request: any) => Promise<LoadResult>;
	requests: any[];
	resolveNext: (result?: LoadResult) => void;
}

/** Creates a loader whose results are resolved manually by the test */
function createDeferredLoader(): DeferredLoader {
	const requests: any[] = [];
	const resolvers: ((result: LoadResult) => void)[] = [];
	return {
		requests,
		load: (request: any) =>
			new Promise<LoadResult>((r) => {
				requests.push(request);
				resolvers.push(r);
			}),
		resolveNext: (result?: LoadResult) => {
			resolvers.shift()!(result ?? { items: [] });
		},
	};
}

function getInput(container: HTMLElement): HTMLElement {
	return container.querySelector(".torp-combo-box-input")!;
}

function getOptions(container: HTMLElement): HTMLElement[] {
	return [...container.querySelectorAll("button[role=option]")] as HTMLElement[];
}

describe("ComboBox - Loading options from a network loader", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("shows a loading state, then the loaded options", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderComboBox as any, {
			value: null,
			load: deferred.load,
		});

		// Nothing loaded yet: loading indicator shows
		expect(queryByText(container, "Loading…")).toBeInTheDocument();
		expect(getOptions(container).length).toBe(0);

		deferred.resolveNext({
			items: [
				{ id: 1, text: "Cat" },
				{ id: 2, text: "Dog" },
			],
		});
		await tick();

		expect(queryByText(container, "Loading…")).not.toBeInTheDocument();
		expect(queryByText(container, "Cat")).toBeInTheDocument();
		expect(queryByText(container, "Dog")).toBeInTheDocument();
	});

	it("refetches with the search text as the user types", async () => {
		const deferred = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderComboBox as any, { value: null, load: deferred.load });

		deferred.resolveNext();
		await tick();
		expect(deferred.requests[0]).toEqual({ searchText: undefined });

		const input = getInput(container);
		await userEvent.click(input);
		await userEvent.type(input, "c");

		await tick();
		expect(deferred.requests.at(-1)).toMatchObject({ searchText: "c" });

		deferred.resolveNext({ items: [{ id: 1, text: "Cat" }] });
		await tick();

		expect(queryByText(container, "Cat")).toBeInTheDocument();
	});

	it("selects a loaded option and updates the value", async () => {
		const deferred = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderComboBox as any, {
			value: null,
			load: deferred.load,
			onchange,
		});

		deferred.resolveNext({
			items: [
				{ id: "cat", text: "Cat" },
				{ id: "dog", text: "Dog" },
			],
		});
		await tick();

		await userEvent.click(getInput(container));
		await userEvent.click(queryByText(container, "Dog")!);
		await tick();

		// The internal ListBox writes through to the ComboBox value
		expect(onchange).toHaveBeenCalledWith("dog");
	});

	it("calls onload with the normalized result", async () => {
		const deferred = createDeferredLoader();
		const onload = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderComboBox as any, { value: null, load: deferred.load, onload });

		// Bare array loaders are normalized into { items }
		deferred.resolveNext([{ id: 1, text: "Cat" }] as any);
		await tick();

		expect(onload).toHaveBeenCalledWith({ items: [{ id: 1, text: "Cat" }] });
	});

	it("uses getItemLabel and getItemValue when rendering options", async () => {
		const deferred = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderComboBox as any, {
			value: null,
			load: deferred.load,
			getItemLabel: (p: any) => p.name.toUpperCase(),
			getItemValue: (p: any) => p.key,
			onchange,
		});

		deferred.resolveNext({
			items: [
				{ key: "k1", name: "cat" },
				{ key: "k2", name: "dog" },
			],
		});
		await tick();

		await userEvent.click(getInput(container));

		expect(queryByText(container, "CAT")).toBeInTheDocument();
		expect(queryByText(container, "DOG")).toBeInTheDocument();

		await userEvent.click(getOptions(container)[0]);
		await tick();

		expect(onchange).toHaveBeenCalledWith("k1");
	});
});
