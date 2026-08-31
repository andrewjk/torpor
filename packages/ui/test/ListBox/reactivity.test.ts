import { getByText } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { $watch, mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import ListBoxCallbacks from "./components/ListBoxCallbacks.torp";

describe("ListBox reactivity", () => {
	it("type prop updates after mount", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const $state = $watch({ type: "single" as "single" | "multiple", value: [] as any[] });
		mount(container, ListBoxCallbacks, $state);

		const listBox = container.querySelector('[role="listbox"]');
		expect(listBox).not.toHaveAttribute("aria-multiselectable");

		$state.type = "multiple";

		expect(listBox).toHaveAttribute("aria-multiselectable", "true");

		// Selection should now be multi-select: clicking two items keeps both
		getByText(container, "Content 1").click();
		getByText(container, "Content 2").click();

		const selected = container.querySelectorAll('[aria-selected="true"]');
		expect(selected).toHaveLength(2);
	});
});
