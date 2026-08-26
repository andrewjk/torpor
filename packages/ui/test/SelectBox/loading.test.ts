import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, assert, describe, expect, it, vi } from "vite-plus/test";
import type { LoadResult } from "../../../src/SelectBox/index";
import LoaderSelectBox from "./components/LoaderSelectBox.torp";

const tick = () => new Promise((r) => setTimeout(r));

function getTrigger(container: HTMLElement): HTMLElement {
	return container.querySelector(".torp-select-box-trigger")!;
}

function getOptions(container: HTMLElement): HTMLElement[] {
	return [...container.querySelectorAll("button[role=option]")] as HTMLElement[];
}

describe("SelectBox - Loading options from a network loader", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("loads options once and selects one", async () => {
		let resolve!: (result: LoadResult) => void;
		const requests: any[] = [];
		const load = (request: any) =>
			new Promise<LoadResult>((r) => {
				requests.push(request);
				resolve = r;
			});
		const onchange = vi.fn();

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderSelectBox as any, { value: null, load, onchange });

		await tick();
		expect(requests).toEqual([{}]);

		resolve({
			items: [
				{ id: 1, text: "Cat" },
				{ id: 2, text: "Dog" },
			],
		});
		await tick();

		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		expect(queryByText(container, "Cat")).toBeInTheDocument();
		expect(queryByText(container, "Dog")).toBeInTheDocument();

		await userEvent.click(queryByText(container, "Dog")!);
		assert(trigger.textContent!.includes("2"), "trigger should show the selected item");
		expect(onchange).toHaveBeenCalledWith(2);
	});

	it("shows the loading indicator while the first load is pending", async () => {
		let resolve!: (result: LoadResult) => void;
		const load = () =>
			new Promise<LoadResult>((r) => {
				resolve = r;
			});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderSelectBox as any, { value: null, load });

		expect(queryByText(container, "Loading…")).toBeInTheDocument();
		expect(getOptions(container).length).toBe(0);

		resolve({ items: [{ id: 1, text: "Cat" }] });
		await tick();

		expect(queryByText(container, "Loading…")).not.toBeInTheDocument();
		expect(getOptions(container).length).toBe(1);
	});

	it("renders an error message when the load fails", async () => {
		let reject!: (err: Error) => void;
		const load = () =>
			new Promise<LoadResult>((_, rj) => {
				reject = rj;
			});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderSelectBox as any, { value: null, load });

		reject(new Error("Network unavailable"));
		await tick();

		const alert = container.querySelector('[role="alert"]');
		assert(alert, "alert not found");
		expect(alert).toHaveTextContent("Network unavailable");
	});

	it("loads only once for repeated open/close cycles", async () => {
		let resolve!: (result: LoadResult) => void;
		let calls = 0;
		const load = () =>
			new Promise<LoadResult>((r) => {
				calls++;
				resolve = r;
			});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LoaderSelectBox as any, { value: null, load });

		resolve({ items: [{ id: 1, text: "Cat" }] });
		await tick();
		expect(calls).toBe(1);

		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await userEvent.click(trigger);
		await userEvent.click(trigger);
		await tick();

		expect(calls).toBe(1);
		expect(getOptions(container).length).toBe(1);
	});
});
