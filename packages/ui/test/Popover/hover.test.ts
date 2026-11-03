import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it } from "vite-plus/test";
import PopoverHoverPress from "./components/PopoverHoverTest.torp";
import PopoverHoverContentTest from "./components/PopoverHoverContentTest.torp";

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

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();

		getTrigger(container).dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

		// Not yet -- intent delay hasn't elapsed
		await wait(5);
		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();

		await wait(30);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();
	});

	it("a quick pass-over does not open", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 50, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(80);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("stays open when the pointer moves into the content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 40 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		// Leaving the trigger arms the close timer...
		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

		// ...but entering the content cancels it
		const content = document.querySelector(".torp-popover-content")!;
		content.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
		await wait(70);

		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();
	});

	it("closes after the exit grace period", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(50);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("closes after the pointer leaves the content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);

		// Move from the trigger into the content
		const content = document.querySelector(".torp-popover-content")!;
		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		content.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
		await wait(10);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		// Then leave the content entirely
		content.dispatchEvent(
			new MouseEvent("mouseleave", { bubbles: false, relatedTarget: document.body }),
		);
		await wait(50);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("focus opens immediately and blur closes after the grace period", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, { hoverDelay: 500, exitGrace: 20 });

		const trigger = getTrigger(container);
		await userEvent.click(trigger); // focus
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		trigger.blur();
		await wait(50);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("closes after focus leaves the content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverContentTest as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.focus(); // opens immediately
		expect(queryByText(document.body, "Inside content")).toBeInTheDocument();

		// Move focus into the content; the trigger's close timer is canceled
		const contentButton = document.querySelector(".torp-popover-content button") as HTMLElement;
		contentButton.focus();
		await wait(50);
		expect(queryByText(document.body, "Inside content")).toBeInTheDocument();

		// And leaving the content closes it after the grace period
		contentButton.blur();
		await wait(50);
		expect(queryByText(document.body, "Inside content")).not.toBeInTheDocument();
	});

	it("a scripted refocus on hide does not re-open the popout", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverContentTest as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		await userEvent.click(trigger); // opens and focuses the trigger
		expect(queryByText(document.body, "Inside content")).toBeInTheDocument();

		// Move focus into the content
		const contentButton = document.querySelector(".torp-popover-content button")!;
		await userEvent.click(contentButton);
		expect(document.activeElement).toBe(contentButton);

		// An outside click hides the content, and `refocusAnchorOnHide`
		// drops focus back onto the trigger. That scripted refocus is not
		// user intent, so it must not re-open the popout
		await userEvent.click(document.body);
		await wait(50);

		expect(queryByText(document.body, "Inside content")).not.toBeInTheDocument();
		expect(document.activeElement).toBe(trigger);
	});

	it("the press trigger still works alongside", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PopoverHoverPress as any, {});

		await userEvent.click(container.querySelector("button.torp-popout-trigger")!);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		await userEvent.click(container.querySelector("button.torp-popout-trigger")!);
		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});
});
