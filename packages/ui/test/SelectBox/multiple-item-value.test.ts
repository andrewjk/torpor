import { queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import SelectBoxMultiple from "./components/SelectBoxMultiple.torp";

describe("SelectBox", () => {
	it("Multiple item default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxMultiple, { value: ["Item 2"] });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		await userEvent.click(button);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryAllByText(container, "Item 2").at(-1)).toBeInTheDocument();
		expect(queryAllByText(container, "Item 2").at(-1)).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Item 3")).toBeInTheDocument();
	});
});
