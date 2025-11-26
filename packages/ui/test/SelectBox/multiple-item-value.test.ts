import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import SelectBoxMultiple from "./components/SelectBoxMultiple.torp";

describe("SelectBox", () => {
	it("Multiple item default value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxMultiple, { value: [1] });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		expect(queryByText(container, "Item 1")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toHaveAttribute("aria-selected", "true");
		expect(queryByText(container, "Item 3")).toBeInTheDocument();
	});
});
