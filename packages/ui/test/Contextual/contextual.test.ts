import { fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import ContextualTest from "./components/ContextualTest.torp";

const tick = () => new Promise((r) => setTimeout(r));

function setup(props: Record<string, any> = {}) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	mount(container, ContextualTest as any, props);
	const trigger = container.querySelector<HTMLElement>(".torp-popover-trigger-contextual")!;
	return { container, trigger };
}

describe("Contextual", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	it("opens its content at the pointer on right-click", async () => {
		const onopen = vi.fn();
		const { trigger } = setup({ onopen });

		fireEvent.contextMenu(trigger, { clientX: 10, clientY: 20 });
		await tick();

		expect(onopen).toHaveBeenCalled();
		const content = document.querySelector<HTMLElement>(".torp-popover-content-contextual")!;
		expect(content).toBeInTheDocument();
		expect(content).toHaveTextContent("Menu");
		expect(content).toHaveStyle({ position: "fixed" });
	});

	it("closes when clicking outside", async () => {
		const onclose = vi.fn();
		const { container } = setup({ onclose });

		fireEvent.contextMenu(container.querySelector(".torp-popover-trigger-contextual")!, {});
		await tick();
		expect(document.querySelector(".torp-popover-content-contextual")).toBeInTheDocument();

		fireEvent.mouseDown(document.body);
		fireEvent.click(document.body);
		await tick();
		expect(onclose).toHaveBeenCalled();
	});
});
