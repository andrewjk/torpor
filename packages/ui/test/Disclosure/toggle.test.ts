import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import DisclosureTest from "./components/DisclosureTest.torp";

describe("Disclosure", () => {
	it("Toggle", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, DisclosureTest);

		expect(queryByText(container, "Disclosure content")).not.toBeInTheDocument();

		// Clicking the header should reveal the body
		fireEvent.click(getByText(container, "Disclosure header"));
		expect(queryByText(container, "Disclosure content")).toBeInTheDocument();
	});
});
