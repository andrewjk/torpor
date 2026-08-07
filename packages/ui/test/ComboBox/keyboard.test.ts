import { fireEvent, queryAllByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { assert, describe, expect, it } from "vite-plus/test";
import ComboBoxKeyboard from "./components/ComboBoxKeyboard.torp";

describe("ComboBox", () => {
	it("Keyboard", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		const getList = () => container.querySelector('[role="listbox"]')?.parentElement;
		expect(getList()).toHaveAttribute("aria-hidden", "true");

		// Tests from https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
		// Our ComboBox is the equivalent of an editable ARIA combobox

		// The combobox is in the page Tab sequence

		// The popup indicator icon or input (if present), the popup, and the
		// popup descendants are excluded from the page Tab sequence

		// When focus is in the combobox:
		input.focus();

		// Down Arrow: If the popup is available, moves focus into the popup:
		// - If the autocomplete behavior automatically selected a suggestion
		//   before Down Arrow was pressed, focus is placed on the suggestion
		//   following the automatically selected suggestion
		//   ^^^ see below, after testing autocomplete
		// - Otherwise, places focus on the first focusable element in the
		//   popup
		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(getList()).not.toHaveAttribute("aria-hidden");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		// Up Arrow (Optional): If the popup is available, places focus on the
		// last focusable element in the popup
		fireEvent(input, new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		expect(getList()).toHaveAttribute("aria-hidden", "true");
		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// Escape: Dismisses the popup if it is visible. Optionally, if the
		// popup is hidden before Escape is pressed, clears the combobox
		// NOTE: I don't think we can clear the combobox because we don't know
		// what the cleared value would be in all cases?
		fireEvent(input, new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await userEvent.click(input); // show
		expect(getList()).not.toHaveAttribute("aria-hidden");
		fireEvent(input, new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		expect(getList()).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(input);

		// Enter: If the combobox is editable and an autocomplete suggestion is
		// selected in the popup, accepts the suggestion either by placing the
		// input cursor at the end of the accepted value in the combobox or by
		// performing a default action on the value. For example, in a
		// messaging application, the default action may be to add the accepted
		// value to a list of message recipients and then clear the combobox so
		// the user can add another recipient
		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(getList()).not.toHaveAttribute("aria-hidden");
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		expect(input.value).toBe("Chinchilla");
		expect(getList()).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(input);

		//  Printable Characters:
		// - If the combobox is not editable, optionally moves focus to a value
		//   that starts with the typed characters
		//await userEvent.keyboard("do");
		//expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// TODO: maybe?
		// Alt + Down Arrow (Optional): If the popup is available but not
		// displayed, displays the popup without moving focus

		// TODO: maybe?
		// Alt + Up Arrow (Optional): If the popup is displayed:
		// - If the popup contains focus, returns focus to the combobox
		// - Closes the popup

		// When focus is in a listbox popup:
		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(getList()).not.toHaveAttribute("aria-hidden");
		queryByText(container, "Cat")!.focus();

		// Enter: Accepts the focused option in the listbox by closing the
		// popup, placing the accepted value in the combobox, and if the
		// combobox is editable, placing the input cursor at the end of the
		// value
		fireEvent(queryByText(container, "Cat")!, new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		expect(input.value).toBe("Cat");
		expect(getList()).toHaveAttribute("aria-hidden", "true");
		expect(document.activeElement).toBe(input);

		// Escape: Closes the popup and returns focus to the combobox.
		// Optionally, if the combobox is editable, clears the contents of the
		// combobox
		await userEvent.click(input); // show
		expect(getList()).not.toHaveAttribute("aria-hidden");
		queryByText(container, "Dog")!.focus();
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		expect(input.value).toBe("Cat");
		expect(getList()).toHaveAttribute("aria-hidden", "true");

		// NOTE: Select the middle option to make things easier
		await userEvent.click(input);
		await userEvent.click(queryByText(container, "Chinchilla")!);

		// Down Arrow: Moves focus to and selects the next option. If focus is
		// on the last option, either returns focus to the combobox or does
		// nothing
		await userEvent.click(input);
		expect(queryByText(container, "Dog")).toBeInTheDocument();
		queryByText(container, "Cat")!.focus();
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(document.activeElement).toBe(queryAllByText(container, "Chinchilla").at(-1));
		fireEvent(
			queryAllByText(container, "Chinchilla").at(-1)!,
			new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
		);
		expect(document.activeElement).toBe(queryByText(container, "Dog"));
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// Up Arrow: Moves focus to and selects the previous option. If focus is
		// on the first option, either returns focus to the combobox or does
		// nothing
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
		expect(document.activeElement).toBe(queryAllByText(container, "Chinchilla").at(-1));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
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
		fireEvent(queryByText(container, "Cat")!, new KeyboardEvent("keydown", { key: "End", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		// Home (Optional): Either moves focus to and selects the first option
		// or, if the combobox is editable, returns focus to the combobox and
		// places the cursor on the first character
		fireEvent(queryByText(container, "Dog")!, new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
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
		// Backspace (Optional): If the combobox is editable, returns focus to
		// the combobox, removes the selected state if a suggestion was selected,
		// and removes the inline autocomplete string if present
	});

	it.skip("Tab key moves focus out of ComboBox", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		input.focus();

		fireEvent(input, new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

		expect(document.activeElement).not.toBe(input);
	});

	it("aria-activedescendant updates when focus moves", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		const catItem = queryByText(container, "Cat");
		const chinchillaItem = queryByText(container, "Chinchilla");
		assert(catItem, "Cat item not found");
		assert(chinchillaItem, "Chinchilla item not found");

		input.focus();

		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(input).toHaveAttribute("aria-activedescendant", catItem?.id);

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(input).toHaveAttribute("aria-activedescendant", chinchillaItem?.id);
	});

	// Not sure what this is supposed to test
	it.skip("Search type-ahead from list items", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		await userEvent.click(input);

		queryByText(container, "Cat")!.focus();

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "d", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "c", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Chinchilla"));
	});

	it("Home/End keys focus first/last item", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		input.focus();

		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "End", bubbles: true }));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Cat"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "End", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));
	});

	// Not sure what this is supposed to test
	it.skip("Space key doesn't trigger when typing", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		input.focus();

		await userEvent.keyboard("d o");

		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: " ", bubbles: true }));

		expect(document.activeElement).toBe(queryByText(container, "Dog"));
	});

	it("Arrow keys at boundaries don't cause errors", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ComboBoxKeyboard, { value: null });

		const input = container.getElementsByTagName("input")[0];
		assert(input, "input not found");

		input.focus();

		fireEvent(input, new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));

		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		fireEvent(document.activeElement!, new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		expect(document.activeElement).toBe(queryByText(container, "Dog"));
	});
});
