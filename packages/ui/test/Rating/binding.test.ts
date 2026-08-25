import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import RatingBindingTest from "./components/RatingBindingTest.torp";

describe("Rating (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, RatingBindingTest, {});

		expect(within(container).getByText("2")).toBeInTheDocument();

		fireEvent.click(within(container).getAllByRole("radio")[3]);

		expect(within(container).getByText("4")).toBeInTheDocument();
	});
});
