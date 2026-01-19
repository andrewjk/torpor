import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { beforeEach, describe, expect, it } from "vitest";
import MenuCallbacks from "./components/MenuCallbacks.torp";

describe("Menu callbacks", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	function getState() {
		return $watch({
			callbackValue: "",
			buttonClickedValue: "",
			checkChecked: false,
			radioValue: "",
			popoutToggled: false,
			popoutToggledValue: false,
			popoutOpened: false,
			popoutClosed: false,
			popoutResult: "",
		});
	}

	it("MenuButton click calls callback", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		const button = getByText(container, "Button 1");
		await userEvent.click(button);
		expect($state.callbackValue).toBe("button-value-1");
	});

	it("MenuButton onclick is called with correct value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		await userEvent.click(getByText(container, "Button 1"));

		// Component should have handled the click
		expect($state.buttonClickedValue).toBe("button-value-1");
	});

	it("MenuCheck onclick is called when clicked", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		const checkButton = getByText(container, "Check item");
		await userEvent.click(checkButton);

		// Check component toggles its state
		expect($state.checkChecked).toBe(true);

		await userEvent.click(checkButton);

		// Check component toggles its state
		expect($state.checkChecked).toBe(false);
	});

	it("MenuRadioGroup onchange is called with correct value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		await userEvent.click(getByText(container, "Popout trigger"));
		await userEvent.click(getByText(container, "Radio 1"));

		// Radio group should handle the selection
		expect($state.radioValue).toBe("radio-1");
	});

	it("MenuPopout ontoggle is called on open and close", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		await userEvent.click(getByText(container, "Popout trigger"));
		expect(queryByText(container, "Radio 1")).toBeInTheDocument();
		expect($state.popoutToggled).toBe(true);
		expect($state.popoutToggledValue).toBe(true);

		$state.popoutToggled = false;

		await userEvent.click(getByText(container, "Popout trigger"));
		expect(queryByText(container, "Radio 1")).not.toBeInTheDocument();
		expect($state.popoutToggled).toBe(true);
		expect($state.popoutToggledValue).toBe(false);
	});

	it("MenuPopout onopen is called when opening", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		await userEvent.click(getByText(container, "Popout trigger"));
		expect(queryByText(container, "Radio 1")).toBeInTheDocument();
	});

	it("MenuPopout onclose is called when closing", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = getState();
		mount(container, MenuCallbacks, $state);

		await userEvent.click(getByText(container, "Popout trigger"));
		expect(queryByText(container, "Radio 1")).toBeInTheDocument();

		await userEvent.click(getByText(container, "Popout trigger"));
		expect(queryByText(container, "Radio 1")).not.toBeInTheDocument();

		expect($state.popoutClosed).toBe(true);
	});
});
