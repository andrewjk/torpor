import "./svgPolyfill";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import AreaChartTest from "./components/AreaChartTest.torp";
import BarChartTest from "./components/BarChartTest.torp";
import ColumnChartTest from "./components/ColumnChartTest.torp";
import LayeredChartTest from "./components/LayeredChartTest.torp";
import LegendChartTest from "./components/LegendChartTest.torp";
import LineChartTest from "./components/LineChartTest.torp";
import NoAxisChartTest from "./components/NoAxisChartTest.torp";
import StackedChartTest from "./components/StackedChartTest.torp";

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
			(t) =>
				t.getAttribute("dominant-baseline") === "text-after-edge" &&
				["0", "50", "100"].includes(t.textContent?.trim() ?? ""),
		);
		expect(bottomTicks.length).toBe(3);

		// Bars are wider than they are tall
		const bar = container.querySelector("svg rect")!;
		expect(Number(bar.getAttribute("width"))).toBeGreaterThan(Number(bar.getAttribute("height")));
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
		const verticals = [...container.querySelectorAll("svg line")].filter(
			(l) => l.getAttribute("x1") === l.getAttribute("x2"),
		);
		expect(verticals.length).toBe(1);
	});

	it("marks draw into the space left over by the axes", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColumnChartTest as any, {});
		await settle();

		// The x axis reserves one label row (24px) at the bottom, so every
		// column ends at the top of that strip
		const columns = [...container.querySelectorAll("svg rect")];
		expect(columns.length).toBe(5);
		for (let column of columns) {
			const bottom = Number(column.getAttribute("y")) + Number(column.getAttribute("height"));
			expect(bottom).toBeCloseTo(176);
		}

		// The y axis reserves room for its ticks (3 chars * 8 + 12 = 36px) on
		// the left, so no column starts before the plot does
		for (let column of columns) {
			expect(Number(column.getAttribute("x"))).toBeGreaterThanOrEqual(36);
		}

		// The axis labels sit in the strip the columns stay out of
		const labels = [...container.querySelectorAll("svg text")].filter(
			(t) => t.getAttribute("dominant-baseline") === "text-after-edge",
		);
		for (let label of labels) {
			expect(Number(label.getAttribute("y"))).toBeGreaterThan(176);
		}
	});

	it("with no axes, marks use the whole svg", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, NoAxisChartTest as any, {
			series: [
				{ name: "A", color: "", data: [10] },
				{ name: "B", color: "", data: [30] },
				{ name: "C", color: "", data: [70] },
			],
		});
		await settle();

		// Nothing has reserved space, so the first slot is centered in the
		// full 400px width: 400/3/2 = 66.67
		const line = container.querySelector("svg polyline")!;
		const firstX = Number(line.getAttribute("points")!.split(" ")[0]!.split(",")[0]);
		expect(firstX).toBeCloseTo(66.67);

		// And the points layer draws one circle per value
		const circles = container.querySelectorAll("svg circle");
		expect(circles.length).toBe(3);
		expect(circles[0]!.getAttribute("r")).toBe("3");
	});

	it("adding an axis takes space away from the marks", async () => {
		const withAxis = document.createElement("div");
		document.body.appendChild(withAxis);
		mount(withAxis, LineChartTest as any, {});
		await settle();

		// LineChartTest adds a y axis, which reserves 36px on the left, so
		// the same first slot center moves right: 36 + (400-36)/2/2
		const line = withAxis.querySelector("svg polyline")!;
		const firstX = Number(line.getAttribute("points")!.split(" ")[0]!.split(",")[0]);
		expect(firstX).toBeCloseTo(36 + (400 - 36) / 2 / 2);
	});

	it("a legend reserves a strip along the bottom", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LegendChartTest as any, {
			series: [
				{ name: "Alpha", color: "#ff0000", data: [10, 30, 70] },
				{ name: "Beta", color: "#00ff00", data: [20, 60, 40] },
			],
		});
		await settle();

		// The legend's claim (36px for one row) beats the x axis's (24px),
		// so the plot ends at 200 - 36 = 164
		const gridLine = [...container.querySelectorAll("svg line")].find(
			(l) => l.getAttribute("x1") !== l.getAttribute("x2") && Number(l.getAttribute("y1")) === 164,
		);
		expect(gridLine).not.toBeNull();

		// The lines stay above the legend strip
		const marks = [...container.querySelectorAll("svg polyline")].flatMap((p) =>
			p
				.getAttribute("points")!
				.split(" ")
				.map((pt) => Number(pt.split(",")[1])),
		);
		for (let y of marks) {
			expect(y).toBeLessThanOrEqual(164);
		}

		// The legend entries draw inside the strip, below the plot. (The x
		// axis draws the same names as category labels, so only take the
		// middle-baseline texts the legend renders.)
		const legend = [...container.querySelectorAll("svg text")].filter(
			(t) =>
				["Alpha", "Beta"].includes(t.textContent?.trim() ?? "") &&
				t.getAttribute("dominant-baseline") === "middle",
		);
		expect(legend.map((t) => t.textContent?.trim())).toEqual(["Alpha", "Beta"]);
		for (let entry of legend) {
			expect(Number(entry.getAttribute("y"))).toBeGreaterThan(164);
		}

		// With a swatch in the series' color
		expect(container.querySelector('svg rect[fill="#ff0000"]')).not.toBeNull();
	});

	it("an axis on the right reserves its own strip", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LayeredChartTest as any, {
			series: [
				{ name: "A", color: "", data: [10, 40] },
				{ name: "B", color: "", data: [30] },
			],
		});
		await settle();

		// The right axis' ticks need 6 + 24 = 30px, so grid lines stop 30px
		// short of the right edge (the axis line itself runs down that edge)
		const rightEdge = [...container.querySelectorAll("svg line")].filter(
			(l) => l.getAttribute("x1") !== l.getAttribute("x2") && Number(l.getAttribute("x2")) === 370,
		);
		expect(rightEdge.length).toBeGreaterThan(0);
		for (let line of rightEdge) {
			expect(Number(line.getAttribute("x1"))).toBeLessThan(370);
		}
	});

	it("stacked columns pile up and raise the domain", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StackedChartTest as any, { stacked: true });
		await settle();

		const columns = [...container.querySelectorAll("svg rect")];
		expect(columns.length).toBe(5);

		// Each slot's values stack into one centered column
		const slot0 = columns.filter((r) => Math.abs(Number(r.getAttribute("x")) - 63.3) < 1);
		const slot1 = columns.filter((r) => Math.abs(Number(r.getAttribute("x")) - 245.3) < 1);
		expect(slot0.length).toBe(2);
		expect(slot1.length).toBe(3);

		// ...flush, with no gaps between the segments
		for (let slot of [slot0, slot1]) {
			const sorted = slot.sort((a, b) => Number(a.getAttribute("y")) - Number(b.getAttribute("y")));
			for (let i = 1; i < sorted.length; i++) {
				const lower = sorted[i - 1]!;
				const upper = sorted[i]!;
				const lowerBottom = Number(lower.getAttribute("y")) + Number(lower.getAttribute("height"));
				expect(lowerBottom).toBeCloseTo(Number(upper.getAttribute("y")));
			}
		}

		// The domain was raised to the largest slot total (120), which
		// steps by 100
		const ticks = [...container.querySelectorAll("svg text")].map((t) => t.textContent?.trim());
		expect(ticks).toContain("100");
		expect(ticks).toContain("200");
	});

	it("grouped columns keep their values side by side", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StackedChartTest as any, { stacked: false });
		await settle();

		const columns = [...container.querySelectorAll("svg rect")];
		expect(columns.length).toBe(5);

		// Two sub-columns per slot at different x positions
		const xs = columns.map((r) => Number(r.getAttribute("x")));
		expect(new Set(xs).size).toBe(5);

		// Without stacking, the domain is the largest single value (60)
		const ticks = [...container.querySelectorAll("svg text")].map((t) => t.textContent?.trim());
		expect(ticks).toContain("30");
		expect(ticks).toContain("60");
		expect(ticks).not.toContain("200");
	});

	it("AreaChart fills the region under each line", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, AreaChartTest as any, {});
		await settle();

		const polygon = container.querySelector('svg polygon[fill="#ff0000"]')!;
		expect(polygon).not.toBeNull();
		expect(polygon.getAttribute("fill-opacity")).toBe("0.25");

		// The polygon closes along the bottom of the plot
		const points = polygon
			.getAttribute("points")!
			.split(" ")
			.map((pt) => pt.split(",").map(Number));
		const bottom = points[points.length - 1]![1]!;
		expect(bottom).toBeCloseTo(176);

		// And the line is drawn over it
		expect(container.querySelectorAll("svg polyline").length).toBe(1);
	});
});
