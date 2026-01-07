import { queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vitest";
import AccordionSingle from "./components/AccordionSingle.torp";

describe("Accordion", () => {
	it("Updates when value prop changes externally", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = $watch({
			value: 1,
		});
		mount(container, AccordionSingle, $state);

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).toBeInTheDocument();

		$state.value = 0;

		expect(queryByText(container, "Content 1")).toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();

		$state.value = 2;

		expect(queryByText(container, "Content 1")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 2")).not.toBeInTheDocument();
		expect(queryByText(container, "Content 3")).toBeInTheDocument();
	});
});
