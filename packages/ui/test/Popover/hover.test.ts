import { fireEvent, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount, unmount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import PopoverHoverButtonTest from "./components/PopoverHoverButtonTest.torp";
import PopoverHoverPress from "./components/PopoverHoverTest.torp";
import PopoverHoverContentTest from "./components/PopoverHoverContentTest.torp";

//const tick = () => new Promise((r) => setTimeout(r));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getTrigger(container: HTMLElement): HTMLElement {
	return container.querySelector(".torp-popover-hover")!;
}

const mounted: HTMLElement[] = [];

function mountPopover(container: HTMLElement, component: any, props?: Record<string, any>): void {
	mount(container, component, props);
	mounted.push(container);
}

describe("Popover - hover trigger", () => {
	afterEach(() => {
		for (const container of mounted.splice(0)) {
			unmount(container);
		}
		document.body.innerHTML = "";
	});

	it("opens after the intent delay and stays open while hovered", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 20, exitGrace: 20 });

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
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 50, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(80);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("stays open when the pointer moves into the content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 40 });

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
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(50);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("does not focus the trigger when a hover popover closes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		// A mouse-opened popover never takes focus
		expect(document.activeElement).toBe(document.body);

		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(10);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		trigger.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
		await wait(50);
		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
		expect(document.activeElement).not.toBe(trigger);
	});

	it("closes after the pointer leaves the content", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

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

	it("closes when the pointer leaves the content without a trigger leave", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 0, exitGrace: 20 });

		const trigger = getTrigger(container);
		await userEvent.hover(trigger);
		await wait(10);

		const content = document.querySelector(".torp-popover-content") as HTMLElement;
		expect(content).toBeTruthy();

		// Hover the content directly: this covers the content opening under
		// the pointer, where no trigger mouseleave was observed
		await userEvent.hover(content);
		await wait(10);
		expect(document.querySelector(".torp-popover-content")).toBeTruthy();

		await userEvent.unhover(content);
		await wait(50);
		expect(document.querySelector(".torp-popover-content")).toBeNull();
	});

	it("focus opens immediately and blur closes after the grace period", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 500, exitGrace: 20 });

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
		mountPopover(container, PopoverHoverContentTest as any, { hoverDelay: 0, exitGrace: 20 });

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
		mountPopover(container, PopoverHoverContentTest as any, { hoverDelay: 0, exitGrace: 20 });

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
		mountPopover(container, PopoverHoverPress as any, {});

		await userEvent.click(container.querySelector("button.torp-popout-trigger")!);
		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();

		await userEvent.click(container.querySelector("button.torp-popout-trigger")!);
		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	// Touch taps synthesize the mouseenter/focus sequence the hover machine
	// reacts to. The pointerdown is the only event carrying the modality, so
	// it's dispatched manually (jsdom has no PointerEvent)
	function touchPointerDown(target: HTMLElement) {
		const e = new Event("pointerdown", { bubbles: true, cancelable: true });
		Object.defineProperty(e, "pointerType", { value: "touch" });
		target.dispatchEvent(e);
	}

	it("a touch tap on the trigger's inert surface opens the popout", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, { hoverDelay: 50, exitGrace: 20 });

		const trigger = getTrigger(container);
		touchPointerDown(trigger);
		trigger.focus(); // the tap focuses the focusable trigger

		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();
	});

	it("a touch tap on an embedded control runs the action without opening", async () => {
		const onclick = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverButtonTest as any, {
			hoverDelay: 20,
			exitGrace: 20,
			onclick,
		});

		const button = container.querySelector("button")!;
		const trigger = container.querySelector(".torp-popover-hover")!;

		// The tap: pointerdown on the control, then the browser synthesizes
		// mouseenter on the trigger and fires the control's click
		touchPointerDown(button);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		fireEvent.click(button);
		await wait(60);

		// The action ran; the popout did not
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("touchBehavior open opens even over an embedded control", async () => {
		const onclick = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverButtonTest as any, {
			hoverDelay: 20,
			exitGrace: 20,
			touchBehavior: "open",
			onclick,
		});

		const button = container.querySelector("button")!;
		const trigger = container.querySelector(".torp-popover-hover")!;
		touchPointerDown(button);
		trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
		await wait(60);

		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();
	});

	it("touchBehavior ignore never opens from a tap, even on the inert surface", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverPress as any, {
			hoverDelay: 20,
			exitGrace: 20,
			touchBehavior: "ignore",
		});

		const trigger = getTrigger(container);
		touchPointerDown(trigger);
		trigger.focus();
		await wait(40);

		expect(queryByText(document.body, "Popover content")).not.toBeInTheDocument();
	});

	it("keyboard focus still opens after an interactive touch tap", async () => {
		const onclick = vi.fn();
		const container = document.createElement("div");
		document.body.appendChild(container);
		mountPopover(container, PopoverHoverButtonTest as any, {
			hoverDelay: 20,
			exitGrace: 20,
			onclick,
		});

		// Tap the control (suppresses the synthesized mouseenter)...
		touchPointerDown(container.querySelector("button")!);

		// ...then keyboard-focus the trigger: not user "hover intent", but
		// focus-open is the keyboard path and must keep working
		getTrigger(container).focus();

		expect(queryByText(document.body, "Popover content")).toBeInTheDocument();
	});
});
