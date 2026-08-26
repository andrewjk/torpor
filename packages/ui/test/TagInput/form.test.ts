import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import TagInputFormTest from "./components/TagInputFormTest.torp";

async function tick() {
	await new Promise((r) => setTimeout(r, 0));
}

describe("TagInput (in forms)", () => {
	it("uses the Field's name for its form values", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputFormTest, {});

		const hidden = container.querySelectorAll('input[type="hidden"]');
		for (let item of hidden) {
			expect(item).toHaveAttribute("name", "labels");
		}
	});

	it("validates on blur and after tags are removed", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, TagInputFormTest, {});

		const root = container.querySelector(".torp-tag-input") as HTMLElement;
		const input = within(container).getByRole("textbox", { name: "Labels" });

		// Blurring with no tags fails the minimum of 1
		fireEvent.focusOut(input);
		await tick();

		expect(within(container).getByText("Add at least one label")).toBeInTheDocument();
		expect(root).toHaveAttribute("aria-invalid", "true");

		// Adding a tag revalidates (the field was blurred) and clears the error
		fireEvent.input(input, { target: { value: "red" } });
		fireEvent.keyDown(input, { key: "Enter" });
		await tick();

		expect(within(container).queryByText("Add at least one label")).toBeNull();
	});
});
