import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import TagInputTest from "./components/TagInputTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, TagInputTest, { ...props, onchange });
	return {
		container,
		onchange,
		input: () => within(container).getByRole("textbox", { name: "Tags" }),
		tags: () => within(container).getAllByRole("listitem"),
	};
}

describe("TagInput", () => {
	it("renders the given tags", async () => {
		const { tags } = setup({ value: ["alpha", "beta"] });

		expect(tags()).toHaveLength(2);
		expect(tags()[0]).toHaveTextContent("alpha");
	});

	it("adds a tag on Enter and clears the field", async () => {
		const { input, onchange, tags } = setup();

		fireEvent.input(input(), { target: { value: "new" } });
		fireEvent.keyDown(input(), { key: "Enter" });

		expect(tags()).toHaveLength(1);
		expect(tags()[0]).toHaveTextContent("new");
		expect(input()).toHaveValue("");
		expect(onchange).toHaveBeenCalledWith(["new"]);
	});

	it("adds a tag on comma", async () => {
		const { input, tags } = setup();

		fireEvent.input(input(), { target: { value: "a,b" } });
		fireEvent.keyDown(input(), { key: "," });

		expect(tags()).toHaveLength(1);
		expect(tags()[0]).toHaveTextContent("a,b");
	});

	it("trims whitespace when adding a tag", async () => {
		const { input, onchange } = setup();

		fireEvent.input(input(), { target: { value: "  spaced  " } });
		fireEvent.keyDown(input(), { key: "Enter" });

		expect(onchange).toHaveBeenCalledWith(["spaced"]);
	});

	it("does not add an empty tag", async () => {
		const { input, onchange } = setup();

		fireEvent.input(input(), { target: { value: "   " } });
		fireEvent.keyDown(input(), { key: "Enter" });

		expect(onchange).not.toHaveBeenCalled();
	});

	it("removes the last tag on Backspace in an empty field", async () => {
		const { input, onchange, tags } = setup({ value: ["a", "b"] });

		fireEvent.keyDown(input(), { key: "Backspace" });

		expect(tags()).toHaveLength(1);
		expect(tags()[0]).toHaveTextContent("a");
		expect(onchange).toHaveBeenCalledWith(["a"]);
	});

	it("does not remove a tag on Backspace while typing", async () => {
		const { input, tags } = setup({ value: ["a"] });

		fireEvent.input(input(), { target: { value: "x" } });
		fireEvent.keyDown(input(), { key: "Backspace" });

		expect(tags()).toHaveLength(1);
	});

	it("removes a specific tag with its remove button", async () => {
		const { container, onchange, tags } = setup({ value: ["a", "b", "c"] });

		fireEvent.click(within(container).getByRole("button", { name: "Remove b" }));

		expect(tags()).toHaveLength(2);
		expect(onchange).toHaveBeenCalledWith(["a", "c"]);
	});

	it("allows duplicate tags", async () => {
		const { input, onchange, tags } = setup({ value: ["a"] });

		fireEvent.input(input(), { target: { value: "a" } });
		fireEvent.keyDown(input(), { key: "Enter" });

		expect(tags()).toHaveLength(2);
		expect(onchange).toHaveBeenCalledWith(["a", "a"]);
	});

	it("does nothing when disabled", async () => {
		const { container, input, onchange, tags } = setup({ value: ["a"], disabled: true });

		fireEvent.input(input(), { target: { value: "b" } });
		fireEvent.keyDown(input(), { key: "Enter" });
		fireEvent.click(within(container).getByRole("button", { name: "Remove a" }));

		expect(tags()).toHaveLength(1);
		expect(onchange).not.toHaveBeenCalled();
	});

	it("submits its tags with a form", async () => {
		const { container } = setup({ value: ["a", "b"], name: "tags" });

		const hidden = container.querySelectorAll('input[type="hidden"]');
		expect(hidden).toHaveLength(2);
		expect(hidden[0]).toHaveAttribute("name", "tags");
		expect(hidden[0]).toHaveAttribute("value", "a");
		expect(hidden[1]).toHaveAttribute("value", "b");
	});
});
