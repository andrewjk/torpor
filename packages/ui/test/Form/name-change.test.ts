import { fireEvent, getByText, queryByPlaceholderText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { expect, test } from "vite-plus/test";
import FieldNameChangeTest from "./components/FieldNameChangeTest.torp";

test("a changed Field name prop updates the input name", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, FieldNameChangeTest);

	expect(queryByPlaceholderText(container, "Name...")).toHaveAttribute("name", "first");
	expect(queryByPlaceholderText(container, "Bio...")).toHaveAttribute("name", "first");
	expect(queryByPlaceholderText(container, "Direct...")).toHaveAttribute("name", "first");

	fireEvent.click(getByText(container, "rename"));

	expect(queryByPlaceholderText(container, "Name...")).toHaveAttribute("name", "second");
	expect(queryByPlaceholderText(container, "Bio...")).toHaveAttribute("name", "second");
	expect(queryByPlaceholderText(container, "Direct...")).toHaveAttribute("name", "second");
});
