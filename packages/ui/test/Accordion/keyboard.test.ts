import { fireEvent, getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionKeyboard from "./components/AccordionKeyboard.torp";

describe("Accordion", () => {
	it("Keyboard", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionKeyboard, { value: ["1", "2"] });

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/accordion/

		// Enter or Space:
		//   * When focus is on the accordion header for a collapsed panel, expands the associated panel.
		//     If the implementation allows only one panel to be expanded, and if another panel is expanded,
		//     collapses that panel
		//   * When focus is on the accordion header for an expanded panel, collapses the panel if the
		//     implementation supports collapsing. Some implementations require one panel to be expanded
		//     at all times and allow only one panel to be expanded; so, they do not support a collapse
		//     function
		// NOTE: I don't think we can test this
		// NOTE: Accordion headers are buttons so this functionality should be baked in by default
		//screen.queryByText('Header 1').focus();
		//expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
		//fireEvent(screen.getByText('Header 1'), { key: 'Space' });
		//expect(screen.queryByText('Content 1')).toBeInTheDocument();
		//fireEvent(screen.getByText('Header 1'), { key: 'Space' });
		//expect(screen.queryByText('Content 1')).not.toBeInTheDocument();

		// Tab: Moves focus to the next focusable element; all focusable elements in the accordion are
		// included in the page Tab sequence
		// NOTE: I don't think we can test this
		//fireEvent(screen.getByText('Header 1'), { key: 'Tab' });
		//expect(document.activeElement).toBe(screen.queryByText('Header 2'));

		// Shift + Tab: Moves focus to the previous focusable element; all focusable elements in the
		// accordion are included in the page Tab sequence
		// NOTE: I don't think we can test this
		//fireEvent(screen.getByText('Header 2'), { key: 'Tab', shiftKey: true });
		//expect(document.activeElement).toBe(screen.queryByText('Header 1'));

		// Down Arrow: If focus is on an accordion header, moves focus to the next accordion header.
		// If focus is on the last accordion header, either does nothing or moves focus to the first
		// accordion header
		fireEvent(getByText(container, "Header 1"), new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(document.activeElement).toBe(queryByText(container, "Header 2"));

		// Up Arrow: If focus is on an accordion header, moves focus to the previous accordion header.
		// If focus is on the first accordion header, either does nothing or moves focus to the last
		// accordion header
		fireEvent(getByText(container, "Header 2"), new KeyboardEvent("keydown", { key: "ArrowUp" }));
		expect(document.activeElement).toBe(queryByText(container, "Header 1"));

		// Home: When focus is on an accordion header, moves focus to the first accordion header
		fireEvent(getByText(container, "Header 3"), new KeyboardEvent("keydown", { key: "Home" }));
		expect(document.activeElement).toBe(queryByText(container, "Header 1"));

		// End: When focus is on an accordion header, moves focus to the last accordion header
		fireEvent(getByText(container, "Header 1"), new KeyboardEvent("keydown", { key: "End" }));
		expect(document.activeElement).toBe(queryByText(container, "Header 3"));
	});
});
