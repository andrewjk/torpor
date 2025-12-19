import { fireEvent, queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vitest";
import SelectBoxKeyboard from "./components/SelectBoxKeyboard.torp";

describe("SelectBox", () => {
	it("Keyboard", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SelectBoxKeyboard, { value: null });

		const button = container.getElementsByTagName("button")[0];
		assert(button, "button not found");

		const list = button.nextElementSibling;
		expect(list).toHaveAttribute("aria-hidden", "true");

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
		// Our SelectBox is the equivalent of a non-editable ARIA combobox

		// The combobox is in the page Tab sequence

		// The popup indicator icon or button (if present), the popup, and the
		// popup descendants are excluded from the page Tab sequence

		// When focus is in the combobox:
		button.focus();

		// Down Arrow: If the popup is available, moves focus into the popup:
		// - If the autocomplete behavior automatically selected a suggestion
		//   before Down Arrow was pressed, focus is placed on the suggestion
		//   following the automatically selected suggestion
		//   ^^^ see below, after testing autocomplete
		// - Otherwise, places focus on the first focusable element in the
		//   popup
		fireEvent(button, new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(list).not.toHaveAttribute("aria-hidden");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		// Up Arrow (Optional): If the popup is available, places focus on the
		// last focusable element in the popup
		await userEvent.click(button); // hide
		expect(list).toHaveAttribute("aria-hidden", "true");
		fireEvent(button, new KeyboardEvent("keydown", { key: "ArrowUp" }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// Escape: Dismisses the popup if it is visible. Optionally, if the
		// popup is hidden before Escape is pressed, clears the combobox
		// NOTE: I don't think we can clear the combobox because we don't know
		// what the cleared value would be in all cases?
		await userEvent.click(button); // hide
		await userEvent.click(button); // show
		expect(list).not.toHaveAttribute("aria-hidden");
		fireEvent(button, new KeyboardEvent("keydown", { key: "Escape" }));
		expect(list).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(button);

		// Enter: If the combobox is editable and an autocomplete suggestion is
		// selected in the popup, accepts the suggestion either by placing the
		// input cursor at the end of the accepted value in the combobox or by
		// performing a default action on the value. For example, in a
		// messaging application, the default action may be to add the accepted
		// value to a list of message recipients and then clear the combobox so
		// the user can add another recipient
		fireEvent(button, new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(list).not.toHaveAttribute("aria-hidden");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Enter" }));
		expect(button.textContent.trim()).toBe("Chinchilla");
		expect(list).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(button);

		//  Printable Characters:
		// - If the combobox is not editable, optionally moves focus to a value
		//   that starts with the typed characters
		await userEvent.keyboard("do");
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// TODO: maybe?
		// Alt + Down Arrow (Optional): If the popup is available but not
		// displayed, displays the popup without moving focus

		// TODO: maybe?
		// Alt + Up Arrow (Optional): If the popup is displayed:
		// - If the popup contains focus, returns focus to the combobox
		// - Closes the popup

		// When focus is in a listbox popup:
		await userEvent.click(button); // hide
		await userEvent.click(button); // show
		expect(list).not.toHaveAttribute("aria-hidden");
		queryByText(container, "Cat")!.focus();

		// Enter: Accepts the focused option in the listbox by closing the
		// popup, placing the accepted value in the combobox, and if the
		// combobox is editable, placing the input cursor at the end of the
		// value
		fireEvent(queryByText(container, "Cat")!, new KeyboardEvent("keydown", { key: "Enter" }));
		expect(button.textContent.trim()).toBe("Cat");
		expect(list).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(button);

		// Escape: Closes the popup and returns focus to the combobox.
		// Optionally, if the combobox is editable, clears the contents of the
		// combobox
		await userEvent.click(button); // show
		expect(list).not.toHaveAttribute("aria-hidden");
		queryByText(container, "Dog")!.focus();
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "Escape" }));
		expect(button.textContent.trim()).toBe("Cat");
		expect(list).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(button);

		// NOTE: Select the middle option to make things easier
		await userEvent.click(button);
		await userEvent.click(queryByText(container, "Chinchilla")!);

		// Down Arrow: Moves focus to and selects the next option. If focus is
		// on the last option, either returns focus to the combobox or does
		// nothing
		await userEvent.click(button);
		expect(queryByText(container, "Dog")).toBeInTheDocument();
		queryByText(container, "Cat")!.focus();
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(document.activeElement).toBe(queryAllByText(container, "Chinchilla").at(-1));
		fireEvent(
			queryAllByText(container, "Chinchilla").at(-1)!,
			new KeyboardEvent("keydown", { key: "ArrowDown" }),
		);
		expect(document.activeElement).toBe(queryByText(container, "Dog"));
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "ArrowDown" }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// Up Arrow: Moves focus to and selects the previous option. If focus is
		// on the first option, either returns focus to the combobox or does
		// nothing
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "ArrowUp" }));
		expect(document.activeElement).toBe(queryAllByText(container, "Chinchilla").at(-1));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowUp" }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowUp" }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		// NOTE: N/A:
		// Right Arrow: If the combobox is editable, returns focus to the
		// combobox without closing the popup and moves the input cursor one
		// character to the right. If the input cursor is on the right-most
		// character, the cursor does not move

		// NOTE: N/A:
		// Left Arrow: If the combobox is editable, returns focus to the
		// combobox without closing the popup and moves the input cursor one
		// character to the left. If the input cursor is on the left-most
		// character, the cursor does not move

		// End (Optional): Either moves focus to the last option or, if the
		// combobox is editable, returns focus to the combobox and places the
		// cursor after the last character
		fireEvent(queryByText(container, "Cat")!, new KeyboardEvent("keydown", { key: "End" }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// Home (Optional): Either moves focus to and selects the first option
		// or, if the combobox is editable, returns focus to the combobox and
		// places the cursor on the first character
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "Home" }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		// TODO:
		// Any printable character:
		// - If the combobox is editable, returns the focus to the combobox
		//   without closing the popup and types the character
		// - Otherwise, moves focus to the next option with a name that starts
		//   with the characters typed

		// NOTE: N/A:
		// Backspace (Optional): If the combobox is editable, returns focus to
		// the combobox and deletes the character prior to the cursor

		// NOTE: N/A:
		// Delete (Optional): If the combobox is editable, returns focus to the
		// combobox, removes the selected state if a suggestion was selected,
		// and removes the inline autocomplete string if present
	});
});
