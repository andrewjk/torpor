import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it, vi } from "vite-plus/test";
import ToggleButtonTest from "./components/ToggleButtonTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function mountGroup(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, ToggleButtonTest as any, props);
	return container;
}

describe("ToggleButton", () => {
	it("toggles its pressed state with aria-pressed", async () => {
		const onchange = vi.fn();
		const container = mountGroup({ onstandalone: onchange });
		const button = within(container).getAllByRole("button")[0];

		expect(button).toHaveAttribute("aria-pressed", "false");
		fireEvent.click(button);
		await tick();

		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(onchange).toHaveBeenLastCalledWith(true);
	});

	it("submits the pressed values of a group", async () => {
		const container = mountGroup();
		const [, bold, italic] = within(container).getAllByRole("button");

		fireEvent.click(bold);
		fireEvent.click(italic);
		await tick();

		expect(bold).toHaveAttribute("aria-pressed", "true");
		expect(italic).toHaveAttribute("aria-pressed", "true");
		expect(new FormData(container.querySelector("form")!).getAll("format")).toEqual([
			"bold",
			"italic",
		]);

		fireEvent.click(bold);
		await tick();
		expect(bold).toHaveAttribute("aria-pressed", "false");
		expect(new FormData(container.querySelector("form")!).getAll("format")).toEqual(["italic"]);
	});

	it("keeps only one value pressed in a single group", async () => {
		const container = mountGroup({ type: "single" });
		const [, bold, italic] = within(container).getAllByRole("button");

		fireEvent.click(bold);
		fireEvent.click(italic);
		await tick();

		expect(bold).toHaveAttribute("aria-pressed", "false");
		expect(italic).toHaveAttribute("aria-pressed", "true");
		expect(new FormData(container.querySelector("form")!).getAll("format")).toEqual(["italic"]);
	});
});
