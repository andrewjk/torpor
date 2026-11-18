import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import TooltipTest from "./components/TooltipTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountTooltip(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, TooltipTest as any, props);
	return container;
}

describe("Tooltip", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("describes its trigger and shows the hint on focus", async () => {
		const container = mountTooltip();
		const trigger = within(container).getByRole("button", { name: "Copy" });

		fireEvent.focus(trigger);
		await tick();

		const tooltip = within(document.body).getByRole("tooltip");
		expect(tooltip).toHaveTextContent("Copy to the clipboard");
		expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
	});

	it("shows on hover and hides on Escape", async () => {
		const container = mountTooltip();
		const trigger = within(container).getByRole("button", { name: "Copy" });

		fireEvent.mouseEnter(trigger);
		await tick();
		expect(within(document.body).getByRole("tooltip")).toBeInTheDocument();

		fireEvent.keyDown(trigger, { key: "Escape" });
		await tick();
		expect(within(document.body).queryByRole("tooltip")).toBeNull();
	});

	it("hides when the pointer leaves", async () => {
		const container = mountTooltip();
		const trigger = within(container).getByRole("button", { name: "Copy" });

		fireEvent.mouseEnter(trigger);
		await tick();
		expect(within(document.body).getByRole("tooltip")).toBeInTheDocument();

		fireEvent.mouseLeave(trigger);
		await new Promise((r) => setTimeout(r, 10));
		expect(within(document.body).queryByRole("tooltip")).toBeNull();
	});

	it("still runs the trigger's click action", () => {
		const onclick = vi.fn();
		const container = mountTooltip({ onclick });
		fireEvent.click(within(container).getByRole("button", { name: "Copy" }));
		expect(onclick).toHaveBeenCalledTimes(1);
	});
});
