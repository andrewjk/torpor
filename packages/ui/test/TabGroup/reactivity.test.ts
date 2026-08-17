import { getByText, queryByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import TabGroupReactive from "./components/TabGroupReactive.torp";

describe("TabGroup reactivity", () => {
	it("orientation prop updates after mount", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = $watch({ orientation: "horizontal" as "horizontal" | "vertical" });
		mount(container, TabGroupReactive, $state);

		const tabList = container.querySelector('[role="tablist"]');
		expect(tabList).toHaveAttribute("aria-orientation", "horizontal");
		expect(getByText(container, "Header 1")).toHaveAttribute("data-orientation", "horizontal");

		$state.orientation = "vertical";

		expect(tabList).toHaveAttribute("aria-orientation", "vertical");
		expect(getByText(container, "Header 1")).toHaveAttribute("data-orientation", "vertical");
	});

	it("activation prop updates after mount", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = $watch({ activation: "manual" as "automatic" | "manual", value: "" });
		mount(container, TabGroupReactive, $state);

		expect(queryByText(container, "Content 1")).toBeInTheDocument();

		// With manual activation, moving focus to a header must not change the content
		getByText(container, "Header 1").focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(getByText(container, "Header 2")).toHaveFocus();
		expect(queryByText(container, "Content 1")).toBeInTheDocument();

		$state.activation = "automatic";

		// With automatic activation, moving focus reveals the content
		getByText(container, "Header 1").focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(queryByText(container, "Content 2")).toBeInTheDocument();
	});
});
