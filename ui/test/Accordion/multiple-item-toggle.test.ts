import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import mount from "../../../view/src/render/mount";
import AccordionMultiple from "./components/AccordionMultiple.tera";

describe("Accordion", () => {
	it("Multiple item toggle", async () => {
		const user = userEvent.setup();

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionMultiple);

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();

		// Clicking header 1 should reveal body 1
		await user.click(getByText(container, "Header 1"));
		expect(queryByText(container, "Content 1")).toBeInTheDocument();

		// Clicking header 2 should reveal body 1 and body 2
		await user.click(getByText(container, "Header 2"));
		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();

		// Clicking header 2 again should hide body 2
		await user.click(getByText(container, "Header 2"));
		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
	});
});
