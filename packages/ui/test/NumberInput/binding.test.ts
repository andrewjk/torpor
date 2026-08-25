import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import NumberInputBindingTest from "./components/NumberInputBindingTest.torp";

describe("NumberInput (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NumberInputBindingTest, {});

		expect(within(container).getByText("5")).toBeInTheDocument();

		fireEvent.keyDown(within(container).getByRole("spinbutton"), { key: "ArrowUp" });

		expect(within(container).getByText("6")).toBeInTheDocument();
	});
});
