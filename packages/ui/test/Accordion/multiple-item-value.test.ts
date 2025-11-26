import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionMultiple from "./components/AccordionMultiple.torp";

describe("Accordion", () => {
	it("Multiple item default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionMultiple, { value: [1] });

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();
	});
});
