import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vitest";
import AccordionMultiple from "./components/AccordionMultiple.torp";
import AccordionSingle from "./components/AccordionSingle.torp";

describe("Accordion", () => {
	it("Fires onchange when opening item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const onchange = vi.fn();
		mount(container, AccordionSingle, { onchange });

		expect(onchange).not.toHaveBeenCalled();

		await userEvent.click(getByText(container, "Header 1"));
		expect(onchange).toHaveBeenCalledWith(0);
	});

	it("Fires onchange when closing item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const onchange = vi.fn();
		mount(container, AccordionSingle, { value: 0, onchange });

		expect(onchange).not.toHaveBeenCalled();

		await userEvent.click(getByText(container, "Header 1"));
		expect(onchange).toHaveBeenCalledWith(undefined);
	});

	it("Fires onchange when switching items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const onchange = vi.fn();
		mount(container, AccordionSingle, { value: 0, onchange });

		await userEvent.click(getByText(container, "Header 2"));
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it("Fires onchange with multiple type", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const onchange = vi.fn();
		mount(container, AccordionMultiple, { onchange });

		await userEvent.click(getByText(container, "Header 1"));
		expect(onchange).toHaveBeenCalledWith(expect.arrayContaining([0]));

		await userEvent.click(getByText(container, "Header 2"));
		expect(onchange).toHaveBeenCalledWith(expect.arrayContaining([0, 1]));
	});
});
