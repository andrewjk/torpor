import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import CommandPaletteTest from "./components/CommandPaletteTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onrun = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, CommandPaletteTest, { ...props, onrun });
	const toggle = () =>
		fireEvent.click(within(container).getByRole("button", { name: "Toggle palette" }));
	return {
		container,
		onrun,
		toggle,
		open: async () => {
			toggle();
			await new Promise((r) => setTimeout(r, 5));
		},
		input: () => within(container).getByRole("combobox"),
		options: () => within(container).getAllByRole("option"),
	};
}

describe("CommandPalette", () => {
	it("shows the commands when opened", async () => {
		const { container, open, options } = setup();

		await open();

		expect(options()).toHaveLength(4);
		expect(within(container).getByRole("option", { name: "New file" })).toBeInTheDocument();
	});

	it("filters commands by label", async () => {
		const { open, input, options } = setup();

		await open();
		fireEvent.input(input(), { target: { value: "file" } });

		expect(options()).toHaveLength(3);
	});

	it("filters commands by keywords", async () => {
		const { open, input, options } = setup();

		await open();
		fireEvent.input(input(), { target: { value: "load" } });

		expect(options()).toHaveLength(1);
		expect(options()[0]).toHaveTextContent("Open file");
	});

	it("shows the empty text when nothing matches", async () => {
		const { container, open, input } = setup({ placeholder: "Search" });

		await open();
		fireEvent.input(input(), { target: { value: "zzz" } });

		expect(within(container).getByText("No results")).toBeInTheDocument();
	});

	it("runs a command on click and closes", async () => {
		const { container, open, onrun } = setup();

		await open();
		fireEvent.click(within(container).getByRole("option", { name: "Save file" }));

		expect(onrun).toHaveBeenCalledTimes(1);
		expect(onrun.mock.calls[0][0].value).toBe("save");
	});

	it("runs the active command on Enter and closes", async () => {
		const { container, open, input, options, onrun } = setup();

		await open();
		expect(options()[0]).toHaveAttribute("data-state", "active");

		fireEvent.keyDown(input(), { key: "ArrowDown" });
		expect(options()[1]).toHaveAttribute("aria-selected", "true");
		expect(input()).toHaveAttribute("aria-activedescendant", options()[1].id);

		fireEvent.keyDown(input(), { key: "Enter" });

		expect(onrun.mock.calls[0][0].value).toBe("open");
		expect(within(container).getByText("closed")).toBeInTheDocument();
	});

	it("does not run a disabled command", async () => {
		const commands = [{ value: "a", label: "Alpha", disabled: true }];
		const { container, open, options, onrun } = setup({ commands });

		await open();
		fireEvent.click(options()[0]);

		expect(onrun).not.toHaveBeenCalled();
		expect(options()[0]).toHaveAttribute("aria-disabled", "true");
	});
});
