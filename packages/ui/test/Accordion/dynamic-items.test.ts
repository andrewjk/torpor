import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionList from "./components/AccordionList.torp";

describe("Accordion", () => {
	it("Handles dynamic addition of items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionList, {
			value: 0,
			items: [
				{ header: "Item 1", text: "Content 1" },
				{ header: "Item 2", text: "Content 2" },
			],
		});

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
	});
});
