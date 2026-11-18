import "./svgPolyfill";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import ScatterChartTest from "./components/ScatterChartTest.torp";

const settle = async () => {
	await new Promise((r) => setTimeout(r, 30));
};

describe("ScatterChart", () => {
	it("draws its points on the Chart layout", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ScatterChartTest as any, {});
		await settle();

		expect(container.querySelectorAll("svg circle")).toHaveLength(2);
		expect(container.querySelector(".torp-chart")).toBeInTheDocument();
		expect(container.querySelector('svg[aria-label="Score"]')).toBeInTheDocument();
	});

	it("draws the numeric x axis and its title", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ScatterChartTest as any, {});
		await settle();

		const labels = [...container.querySelectorAll("svg text")].map((t) => t.textContent?.trim());
		expect(labels).toContain("Effort");
		expect(labels).toContain("0");
	});

	it("draws the points from the bottom left upward", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ScatterChartTest as any, {});
		await settle();

		const points = [...container.querySelectorAll("svg circle")];
		const first = points[0];
		const second = points[1];
		expect(Number(second.getAttribute("cx"))).toBeGreaterThan(Number(first.getAttribute("cx")));
		expect(Number(second.getAttribute("cy"))).toBeLessThan(Number(first.getAttribute("cy")));
	});
});
