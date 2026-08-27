import "./svgPolyfill";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import BarChartTest from "./components/BarChartTest.torp";
import ColumnChartTest from "./components/ColumnChartTest.torp";
import LayeredChartTest from "./components/LayeredChartTest.torp";
import LineChartTest from "./components/LineChartTest.torp";

const settle = async () => {
	// The charts measure their text ~1ms after mount
	await new Promise((r) => setTimeout(r, 30));
};

describe("Charts", () => {
	it("LineChart renders a polyline per series", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LineChartTest as any, {});
		await settle();

		const lines = container.querySelectorAll("svg polyline");
		expect(lines.length).toBe(2);
	});

	it("BarChart renders one bar per series", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, BarChartTest as any, {});
		await settle();

		expect(container.querySelectorAll("svg rect").length).toBe(3);

		// Horizontal bars: category labels sit on the left, value ticks along
		// the bottom
		const leftLabels = [...container.querySelectorAll("svg text")].filter(
			(t) => t.getAttribute("text-anchor") === "end",
		);
		expect(leftLabels.map((t) => t.textContent?.trim())).toEqual(["One", "Two", "Three"]);

		const bottomTicks = [...container.querySelectorAll("svg text")].filter(
			(t) => t.getAttribute("dominant-baseline") === "text-after-edge" &&
				["0", "50", "100"].includes(t.textContent?.trim() ?? ""),
		);
		expect(bottomTicks.length).toBe(3);

		// Bars are wider than they are tall
		const bar = container.querySelector("svg rect")!;
		expect(Number(bar.getAttribute("width"))).toBeGreaterThan(
			Number(bar.getAttribute("height")),
		);
	});

	it("ColumnChart renders a column for every value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColumnChartTest as any, {});
		await settle();

		expect(container.querySelectorAll("svg rect").length).toBe(5);
	});

	it("ColumnChart columns carry tooltips with the series name and value", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColumnChartTest as any, {});
		await settle();

		const titles = [...container.querySelectorAll("svg title")].map((t) => t.textContent);
		expect(titles).toContain("Q1\n50");
		expect(titles).toContain("Q1\n30");
		expect(titles).not.toContain("Q1\n35");
	});

	it("ColumnChart uses the series color when given", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColumnChartTest as any, {});
		await settle();

		const first = container.querySelector('svg rect[fill="hotpink"]');
		expect(first).not.toBeNull();
	});

	it("layers compose: columns with a line overlaid and the value axis on the right", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LayeredChartTest as any, {
			series: [
				{ name: "A", color: "", data: [10, 40] },
				{ name: "B", color: "", data: [30] },
			],
		});
		await settle();

		// Columns for every value of series 0 plus the single-value series 1
		expect(container.querySelectorAll("svg rect").length).toBe(3);

		// The overlaid line with its points
		expect(container.querySelectorAll("svg polyline").length).toBe(1);
		expect(container.querySelectorAll("svg circle").length).toBe(1);

		// Value axis ticks hang off the right edge
		const rightTicks = [...container.querySelectorAll("svg text")].filter(
			(t) => t.getAttribute("text-anchor") === "start",
		);
		expect(rightTicks.map((t) => t.textContent?.trim())).toEqual(["0", "50", "100"]);

		// Two vertical axis lines: right value axis + left category axis... no,
		// category axis is at the bottom here; expect exactly one vertical line
		const verticals = [
			...container.querySelectorAll("svg line"),
		].filter((l) => l.getAttribute("x1") === l.getAttribute("x2"));
		expect(verticals.length).toBe(1);
	});
});
