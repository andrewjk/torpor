import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { expect, test } from "vite-plus/test";
import OptionTest from "./components/OptionTest.torp";

test("Option renders its slotted label", async () => {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, OptionTest);

	const select = container.getElementsByTagName("select")[0];
	expect(select).toBeDefined();

	const options = container.getElementsByTagName("option");
	expect(options).toHaveLength(2);
	expect(options[0].textContent).toBe("Red");
	expect(options[1].textContent).toBe("Blue");

	// The label is element text, while `value` still comes from the prop
	expect(queryByText(container, "Red")).not.toBeNull();
	expect(select.value).toBe("red");
});
