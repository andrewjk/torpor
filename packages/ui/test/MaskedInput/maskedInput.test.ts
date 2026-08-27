import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import MaskedInputTest from "./components/MaskedInputTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function getInput(container: HTMLElement): HTMLInputElement {
	return within(container).getByRole("textbox") as HTMLInputElement;
}

describe("MaskedInput", () => {
	it("inserts literals automatically as the user types", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "(999) 999-9999" });

		const input = getInput(container);

		fireEvent.input(input, { target: { value: "5" } });
		await tick();
		expect(input.value).toBe("(5");

		fireEvent.input(input, { target: { value: "(55" } });
		await tick();
		expect(input.value).toBe("(55");

		fireEvent.input(input, { target: { value: "(5551234" } });
		await tick();
		expect(input.value).toBe("(555) 123-4");
	});

	it("binds only the raw characters", async () => {
		const onchange = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "999-99", onchange });

		const input = getInput(container);
		fireEvent.input(input, { target: { value: "90210xx" } });
		await tick();

		expect(onchange).toHaveBeenCalledWith("90210");
		expect(input.value).toBe("902-10");
	});

	it("rejects characters the mask does not allow", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "LLLL" });

		const input = getInput(container);
		fireEvent.input(input, { target: { value: "ab1c" } });
		await tick();

		// The digit is dropped; letters fill letter slots
		expect(input.value).toBe("abc");
	});

	it("letters preserve case in L slots", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "LL-LL" });

		const input = getInput(container);
		fireEvent.input(input, { target: { value: "aBcd" } });
		await tick();

		expect(input.value).toBe("aB-cd");
	});

	it("deleting from the middle keeps later raw characters", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "9.9.9" });

		const input = getInput(container);
		fireEvent.input(input, { target: { value: "1.2.3" } });
		await tick();

		// Remove the "2": "1..3"
		fireEvent.input(input, { target: { value: "1.3" } });
		await tick();

		expect(input.value).toBe("1.3");
	});

	it("accepts a bound initial value and formats it", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "(999) 999-9999", value: "5558675309" });

		const input = getInput(container);
		await tick();
		expect(input.value).toBe("(555) 867-5309");
	});

	it("shows the mask as the default placeholder", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, MaskedInputTest as any, { mask: "999-99" });

		expect(getInput(container)).toHaveAttribute("placeholder", "999-99");
	});
});
