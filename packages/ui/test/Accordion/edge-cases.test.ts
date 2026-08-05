import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import AccordionEmpty from "./components/AccordionEmpty.torp";

describe("Accordion", () => {
	it("Handles empty accordion", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);

		mount(container, AccordionEmpty);

		expect(container.children.length).toBe(1);
		expect(container.firstChild?.firstChild).toBeNull();
	});
});
