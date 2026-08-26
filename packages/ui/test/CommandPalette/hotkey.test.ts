import { fireEvent, within } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import CommandPaletteTest from "./components/CommandPaletteTest.torp";

function setup(props: Record<string, unknown> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, CommandPaletteTest, props);
	return {
		container,
		state: () => within(container).getByText(/open|closed/).textContent,
	};
}

describe("CommandPalette (hotkey)", () => {
	it("opens with mod+k", async () => {
		const { container, state } = setup({ hotkey: "mod+k" });

		expect(state()).toBe("closed");

		fireEvent.keyDown(document, { key: "k", metaKey: true });

		expect(state()).toBe("open");
	});

	it("toggles closed with mod+k again", async () => {
		const { state } = setup({ hotkey: "mod+k" });

		fireEvent.keyDown(document, { key: "k", metaKey: true });
		fireEvent.keyDown(document, { key: "k", metaKey: true });

		expect(state()).toBe("closed");
	});

	it("accepts ctrl as mod", async () => {
		const { state } = setup({ hotkey: "mod+p" });

		fireEvent.keyDown(document, { key: "p", ctrlKey: true });

		expect(state()).toBe("open");
	});

	it("ignores the key without the modifier", async () => {
		const { state } = setup({ hotkey: "mod+k" });

		fireEvent.keyDown(document, { key: "k" });

		expect(state()).toBe("closed");
	});
});
