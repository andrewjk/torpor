import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import NumberInputTest from "./components/NumberInputTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const onchange = vi.fn();
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, NumberInputTest, { ...props, onchange });
	return { container, onchange, input: () => within(container).getByRole("spinbutton") };
}

describe("NumberInput", () => {
	it("shows the value as text", async () => {
		const { input } = setup({ value: 42 });

		expect(input()).toHaveValue("42");
	});

	it("commits typed text on blur", async () => {
		const { input, onchange } = setup({ value: 1 });

		fireEvent.input(input(), { target: { value: "7" } });
		fireEvent.blur(input());

		expect(onchange).toHaveBeenCalledWith(7);
		expect(input()).toHaveValue("7");
	});

	it("commits typed text on Enter", async () => {
		const { input, onchange } = setup({ value: 1 });

		fireEvent.input(input(), { target: { value: "9" } });
		fireEvent.keyDown(input(), { key: "Enter" });

		expect(onchange).toHaveBeenCalledWith(9);
	});

	it("reverts invalid text on blur", async () => {
		const { input, onchange } = setup({ value: 3 });

		fireEvent.input(input(), { target: { value: "abc" } });
		fireEvent.blur(input());

		expect(onchange).not.toHaveBeenCalled();
		expect(input()).toHaveValue("3");
	});

	it("reverts out-of-range text on blur", async () => {
		const { input, onchange } = setup({ value: 3, max: 10 });

		fireEvent.input(input(), { target: { value: "99" } });
		fireEvent.blur(input());

		expect(onchange).toHaveBeenCalledWith(10);
		expect(input()).toHaveValue("10");
	});

	it("clears to null on blur when emptied", async () => {
		const { input, onchange } = setup({ value: 3 });

		fireEvent.input(input(), { target: { value: "" } });
		fireEvent.blur(input());

		expect(onchange).toHaveBeenCalledWith(null);
		expect(input()).toHaveValue("");
	});

	it("does not commit while typing", async () => {
		const { input, onchange } = setup({ value: 1 });

		fireEvent.input(input(), { target: { value: "7" } });

		expect(onchange).not.toHaveBeenCalled();
	});

	it("submits its value with a form", async () => {
		const { container } = setup({ value: 8, name: "amount" });

		const hidden = container.querySelector('input[type="hidden"]')!;
		expect(hidden).toBeInTheDocument();
		expect(hidden).toHaveAttribute("name", "amount");
		expect(hidden).toHaveAttribute("value", "8");
	});
});
