import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import RadioGroupTest from "./components/RadioGroupTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountGroup(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, RadioGroupTest as any, props);
	return container;
}

function radios(container: HTMLElement): HTMLButtonElement[] {
	return [...container.querySelectorAll<HTMLButtonElement>("[role='radio']")];
}

describe("RadioGroup", () => {
	it("renders a labelled radio group", () => {
		const container = mountGroup();
		const group = within(container).getByRole("radiogroup", { name: "Size" });
		expect(within(group).getAllByRole("radio")).toHaveLength(3);
	});

	it("selects a radio on click and submits its value", async () => {
		const onchange = vi.fn();
		const container = mountGroup({ onchange });
		const [, medium] = radios(container);

		fireEvent.click(medium);
		await tick();

		expect(medium).toHaveAttribute("aria-checked", "true");
		expect(onchange).toHaveBeenCalledWith("medium");
		expect(new FormData(container.querySelector("form")!).getAll("size")).toEqual(["medium"]);
	});

	it("uses the selected radio as the tab stop", () => {
		const container = mountGroup({ value: "large" });
		const [small, medium, large] = radios(container);

		expect(small).toHaveAttribute("tabindex", "-1");
		expect(medium).toHaveAttribute("tabindex", "-1");
		expect(large).toHaveAttribute("tabindex", "0");
	});

	it("moves and selects with the arrow keys", async () => {
		const container = mountGroup({ value: "small" });
		const [small, medium] = radios(container);

		small.focus();
		fireEvent.keyDown(small, { key: "ArrowRight" });
		await tick();

		expect(document.activeElement).toBe(medium);
		expect(medium).toHaveAttribute("aria-checked", "true");
		expect(small).toHaveAttribute("aria-checked", "false");
	});

	it("links the Field label to the selected radio", () => {
		const container = mountGroup({ value: "medium" });
		const label = container.querySelector("label")!;
		const medium = radios(container)[1];
		expect(label).toHaveAttribute("for", medium.id);
	});
});
