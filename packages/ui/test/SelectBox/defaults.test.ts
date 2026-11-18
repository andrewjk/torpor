import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SelectBoxDefaultsTest from "./components/SelectBoxDefaultsTest.torp";

describe("SelectBox (sensible defaults)", () => {
	it("uses the Field value without binding the SelectBox or ListBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxDefaultsTest, {});

		const trigger = within(container).getByRole("combobox");
		fireEvent.click(trigger);
		fireEvent.click(within(container).getByText("Item 1"));

		expect(trigger).toHaveTextContent("Item 1");
		expect(new FormData(container.querySelector("form")!).getAll("picked")).toEqual(["Item 1"]);
	});
});
