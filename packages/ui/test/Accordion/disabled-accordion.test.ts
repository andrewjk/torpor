import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import AccordionDisabled from "./components/AccordionDisabled.torp";

describe("Accordion", () => {
	it("Disabled accordion prevents interaction", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionDisabled, { disabled: true, value: 0 });

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();

		const header2 = getByText(container, "Header 2");
		await userEvent.click(header2);

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
	});

	it("Disabled accordion has aria-disabled on all triggers", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionDisabled, { disabled: true, value: 1 });

		expect(getByText(container, "Header 1")).toHaveAttribute("aria-disabled", "true");
		expect(getByText(container, "Header 2")).toHaveAttribute("aria-disabled", "true");
		expect(getByText(container, "Header 3")).toHaveAttribute("aria-disabled", "true");
	});

	it("Disabled accordion are disabled", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionDisabled, { disabled: true, value: 1 });

		const items = container.querySelectorAll(".torp-accordion-trigger");
		expect(items[0]).toHaveAttribute("disabled");
		expect(items[1]).toHaveAttribute("disabled");
		expect(items[2]).toHaveAttribute("disabled");
	});
});
