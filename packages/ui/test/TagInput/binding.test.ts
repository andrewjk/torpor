import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import TagInputBindingTest from "./components/TagInputBindingTest.torp";

describe("TagInput (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputBindingTest, {});

		expect(within(container).getByText("red", { selector: "#bound-value" })).toBeInTheDocument();

		const input = within(container).getByRole("textbox");
		fireEvent.input(input, { target: { value: "blue" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(within(container).getByText("red,blue")).toBeInTheDocument();
	});
});
