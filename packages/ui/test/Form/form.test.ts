import {
	getByPlaceholderText,
	getByText,
	queryByPlaceholderText,
	queryByText,
} from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { expect, test } from "vitest";
import Form from "./components/FormTest.torp";

test("Form", async () => {
	const user = userEvent.setup();

	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, Form);

	// Label, input, message
	expect(queryByText(container, "Name:")).not.toBeNull();
	expect(queryByPlaceholderText(container, "Name...")).not.toBeNull();
	expect(queryByText(container, "Name is required!")).toBeNull();

	// Label `for` should be automatically hooked up
	expect(queryByPlaceholderText(container, "Name...")).toHaveAttribute("id", "name-id");
	expect(queryByText(container, "Name:")).toHaveAttribute("for", "name-id");

	// Validation should be fired on submit
	await user.click(getByText(container, "Submit"));
	expect(queryByText(container, "Name is required!")).not.toBeNull();

	// After submitting, validation should fire on input
	await user.type(getByPlaceholderText(container, "Name..."), "G");
	expect(queryByText(container, "Name is required!")).toBeNull();
});
