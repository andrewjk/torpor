import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import PinInputTest from "./components/PinInputTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountPin(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, PinInputTest as any, props);
	return container;
}

function fields(container: HTMLElement): HTMLInputElement[] {
	return [...container.querySelectorAll<HTMLInputElement>(".torp-pin-input-field")];
}

describe("PinInput", () => {
	it("renders one labelled field per character", () => {
		const container = mountPin();
		const group = within(container).getByRole("group", { name: "Verification code" });
		expect(within(group).getAllByRole("textbox")).toHaveLength(4);
	});

	it("advances as characters are typed and submits the value", async () => {
		const oncomplete = vi.fn();
		const container = mountPin({ oncomplete });
		const inputs = fields(container);

		inputs[0].focus();
		fireEvent.input(inputs[0], { target: { value: "1" } });
		fireEvent.input(inputs[1], { target: { value: "2" } });
		fireEvent.input(inputs[2], { target: { value: "3" } });
		fireEvent.input(inputs[3], { target: { value: "4" } });
		await tick();

		expect(oncomplete).toHaveBeenCalledWith("1234");
		expect(new FormData(container.querySelector("form")!).getAll("code")).toEqual(["1234"]);
	});

	it("fills the remaining fields from a paste", async () => {
		const container = mountPin();
		const inputs = fields(container);

		fireEvent.paste(inputs[0], {
			clipboardData: { getData: () => "9876" },
		});
		await tick();

		expect(inputs.map((input) => input.value).join("")).toBe("9876");
	});

	it("removes characters with Backspace", async () => {
		const container = mountPin();
		const inputs = fields(container);

		fireEvent.paste(inputs[0], { clipboardData: { getData: () => "12" } });
		await tick();
		fireEvent.keyDown(inputs[1], { key: "Backspace" });
		await tick();

		expect(inputs[0].value).toBe("1");
		expect(inputs[1].value).toBe("");
	});
});
