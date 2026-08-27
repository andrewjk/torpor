import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import TagInputLoader from "./components/TagInputLoader.torp";

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

function getField(container: HTMLElement): HTMLInputElement {
	return within(container).getByRole("combobox") as HTMLInputElement;
}

function getSuggestions(container: HTMLElement): HTMLElement[] {
	return [...container.querySelectorAll('[role="option"]')] as HTMLElement[];
}

describe("TagInput - loading suggestions from a loader", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("fetches suggestions as the user types and shows a loading state", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputLoader as any, { load: loader.load });

		const field = getField(container);
		fireEvent.input(field, { target: { value: "ja" } });
		await tick();

		expect(loader.requests.at(-1)).toEqual({ searchText: "ja" });
		expect(within(container).getByRole("status")).toHaveTextContent("Loading…");

		loader.resolveNext({ items: [{ label: "java" }, { label: "javascript" }] });
		await tick();

		const options = getSuggestions(container);
		expect(options.map((o) => o.textContent?.trim())).toEqual(["java", "javascript"]);
	});

	it("ArrowDown + Enter selects a suggestion as a tag", async () => {
		const loader = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputLoader as any, { load: loader.load, onchange });

		const field = getField(container);
		fireEvent.input(field, { target: { value: "ja" } });
		loader.resolveNext({ items: ["java", "javascript"] });
		await tick();

		fireEvent.keyDown(field, { key: "ArrowDown" });
		await tick();
		expect(getSuggestions(container)[0]).toHaveAttribute("aria-selected", "true");

		fireEvent.keyDown(field, { key: "Enter" });
		await tick();

		expect(field.value).toBe("");
		expect(onchange).toHaveBeenCalledWith(["java"]);
		expect(container.querySelectorAll(".torp-tag-input-tag").length).toBe(1);

		// The dropdown closed after selection
		expect(getSuggestions(container).length).toBe(0);
	});

	it("plain Enter still adds the typed text as a tag", async () => {
		const loader = createDeferredLoader();
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputLoader as any, { load: loader.load, onchange });

		const field = getField(container);
		fireEvent.input(field, { target: { value: "rust" } });
		loader.resolveNext({ items: ["rustlang"] });
		await tick();

		// No ArrowDown: nothing is active, so Enter adds what was typed
		fireEvent.keyDown(field, { key: "Enter" });
		await tick();

		expect(onchange).toHaveBeenCalledWith(["rust"]);
	});

	it("clicking a suggestion adds it as a tag", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputLoader as any, { load: loader.load });

		const field = getField(container);
		fireEvent.input(field, { target: { value: "ja" } });
		loader.resolveNext({ items: ["java", "javascript"] });
		await tick();

		fireEvent.mouseDown(getSuggestions(container)[1]);
		await tick();

		expect(field.value).toBe("");
		expect(within(container).getByText("javascript")).toBeInTheDocument();
	});

	it("shows a no-matches message and closes on empty text", async () => {
		const loader = createDeferredLoader();
		const onopen = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputLoader as any, { load: loader.load, onopen });

		const field = getField(container);
		fireEvent.input(field, { target: { value: "zzz" } });
		loader.resolveNext({ items: [] });
		await tick();

		expect(within(container).getByText("No matches.")).toBeInTheDocument();

		// Backspacing to empty closes the list
		fireEvent.input(field, { target: { value: "" } });
		await tick();
		expect(within(container).queryByRole("listbox")).not.toBeInTheDocument();
		expect(onopen).toHaveBeenLastCalledWith(false);
	});

	it("Escape closes the suggestion list", async () => {
		const loader = createDeferredLoader();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputLoader as any, { load: loader.load });

		const field = getField(container);
		fireEvent.input(field, { target: { value: "ja" } });
		loader.resolveNext({ items: ["java"] });
		await tick();
		expect(getSuggestions(container).length).toBe(1);

		fireEvent.keyDown(field, { key: "Escape" });
		await tick();
		expect(within(container).queryByRole("listbox")).not.toBeInTheDocument();

		// The typed text is untouched, so Enter still adds it as a tag
		expect(field.value).toBe("ja");
	});
});
