import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vite-plus/test";
import PopoverHoverPress from "./components/PopoverHoverTest.torp";

//const tick = () => new Promise((r) => setTimeout(r));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getTrigger(container: HTMLElement): HTMLElement {
	return container.querySelector(".torp-popover-hover")!;
}

describe("Popover - hover trigger", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("opens after the intent delay and stays open while hovered", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 20, exitGrace: 20 });

		expect(queryByText(container, "Popover content")).not.toBeInTheDocument();

		getTrigger(container).dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

		// Not yet -- intent delay hasn't elapsed
		await wait(5);
		expect(queryByText(container, "Popover content")).not.toBeInTheDocument();

		await wait(30);
		expect(queryByText(container, "Popover content")).toBeInTheDocument();
	});

	it("a quick pass-over does not open", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 50, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(80);

		expect(queryByText(container, "Popover content")).not.toBeInTheDocument();
	});

	it("stays open when the pointer moves into the content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 40 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);
		expect(queryByText(container, "Popover content")).toBeInTheDocument();

		// Leaving the trigger arms the close timer...
		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

		// ...but entering the content cancels it
		const content = container.querySelector(".torp-popover-content")!;
		content.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
		await wait(70);

		expect(queryByText(container, "Popover content")).toBeInTheDocument();
	});

	it("closes after the exit grace period", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);
		expect(queryByText(container, "Popover content")).toBeInTheDocument();

		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(50);

		expect(queryByText(container, "Popover content")).not.toBeInTheDocument();
	});

	it("focus opens immediately and blur closes after the grace period", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 500, exitGrace: 20 });

		const trigger = getTrigger(container);
		await userEvent.click(trigger); // focus
		expect(queryByText(container, "Popover content")).toBeInTheDocument();

		trigger.blur();
		await wait(50);

		expect(queryByText(container, "Popover content")).not.toBeInTheDocument();
	});

	it("the press trigger still works alongside", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, {});

		await userEvent.click(container.querySelector("button.torp-popout-trigger")!);
		expect(queryByText(container, "Popover content")).toBeInTheDocument();

		await userEvent.click(container.querySelector("button.torp-popout-trigger")!);
		expect(queryByText(container, "Popover content")).not.toBeInTheDocument();
	});
});
