import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import SplitterBindingTest from "./components/SplitterBindingTest.torp";

describe("Splitter (binding)", () => {
	it("syncs the value both ways", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, SplitterBindingTest, {});

		expect(within(container).getByText("30")).toBeInTheDocument();

		fireEvent.keyDown(within(container).getByRole("separator"), { key: "ArrowRight" });

		expect(within(container).getByText("31")).toBeInTheDocument();
	});
});
