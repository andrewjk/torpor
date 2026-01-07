import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionItemDisabled from "./components/AccordionItemDisabled.torp";

describe("Accordion", () => {
	it("Disabled item prevents interaction", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionItemDisabled, { value: 0 });

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();

		const header2 = getByText(container, "Header 2");
		await userEvent.click(header2);

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
	});

	it("Disabled item has aria-disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionItemDisabled, { value: 1 });

		expect(getByText(container, "Header 1")).not.toHaveAttribute("aria-disabled");
		expect(getByText(container, "Header 2")).toHaveAttribute("aria-disabled", "true");
		expect(getByText(container, "Header 3")).not.toHaveAttribute("aria-disabled");
	});

	it("Disabled item has data-disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionItemDisabled, { value: 1 });

		const items = container.querySelectorAll(".torp-accordion-item");
		expect(items[0]).not.toHaveAttribute("data-disabled");
		expect(items[1]).toHaveAttribute("data-disabled", "true");
		expect(items[2]).not.toHaveAttribute("data-disabled");
	});
});
