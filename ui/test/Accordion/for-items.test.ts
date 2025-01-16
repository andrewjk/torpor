import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionList from "./components/AccordionList.torp";

describe("Accordion", () => {
	it("Items in a for loop", async () => {
		const user = userEvent.setup();

		let $state = $watch({
			value: "1",
			items: [
				{ id: 0, header: "Item 1", text: "Content 1" },
				{ id: 1, header: "Item 2", text: "Content 2" },
				{ id: 2, header: "Item 3", text: "Content 3" },
			],
		});

		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AccordionList, $state);

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();

		$state.items.splice(1, 1);

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();

		// Clicking header 1 should reveal body 1
		await user.click(getByText(container, "Item 1"));
		expect(queryByText(container, "Content 1")).toBeInTheDocument();

		$state.items.push({ id: 3, header: "Item 4", text: "Content 4" });

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).not.toBeInTheDocument();
		expect(queryByText(container, "Item 4")).toBeInTheDocument();
		expect(queryByText(container, "Content 4")).not.toBeInTheDocument();

		// Clicking header 4 should reveal body 4
		await user.click(getByText(container, "Item 4"));
		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 4")).toBeInTheDocument();
	});
});
