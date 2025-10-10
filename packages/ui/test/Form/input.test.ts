import { getByPlaceholderText, queryByPlaceholderText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { mount } from "@torpor/view";
import { expect, test } from "vitest";
import Input from "./components/InputTest.torp";

test("Input", async () => {
	let props = { value: "" };

	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, Input, props);

	expect(queryByPlaceholderText(container, "Name...")).not.toBeNull();

	await userEvent.type(getByPlaceholderText(container, "Name..."), "Greg");
	expect(props.value).toBe("Greg");
});
