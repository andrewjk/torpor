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
import StackedAreaChartTest from "./components/StackedAreaChartTest.torp";
import StackedBarChartTest from "./components/StackedBarChartTest.torp";
import StackedChartTest from "./components/StackedChartTest.torp";
import PieChart from "../../src/Charts/PieChart.torp";

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
		// the bottom. (The last value tick is end-anchored like the category
		// labels, so also match on the baseline.)
		const leftLabels = [...container.querySelectorAll("svg text")].filter(
			(t) =>
				t.getAttribute("text-anchor") === "end" && t.getAttribute("dominant-baseline") === "middle",
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
			series: [{ name: "A", color: "", data: [10, 30, 70] }],
		});
		await settle();

		// Nothing has reserved space, and lines are spread across the full
		// plot width, so the line starts at the very left edge and ends at
		// the right
		const line = container.querySelector("svg polyline")!;
		const points = line
			.getAttribute("points")!
			.split(" ")
			.map((pt) => pt.split(",").map(Number));
		expect(points[0]![0]).toBe(0);
		expect(points[points.length - 1]![0]).toBe(400);

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
		// the line now starts at the plot's left edge instead of the svg's
		const line = withAxis.querySelector("svg polyline")!;
		const firstX = Number(line.getAttribute("points")!.split(" ")[0]!.split(",")[0]);
		expect(firstX).toBe(36);
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

		// The legend's claim (36px) stacks on the x axis's (24px), so the
		// plot ends at 200 - 60 = 140, where the axis line sits
		const axisLine = [...container.querySelectorAll("svg line")].find(
			(l) =>
				l.getAttribute("x1") !== l.getAttribute("x2") && Number(l.getAttribute("y1")) === 140.5,
		);
		expect(axisLine).not.toBeNull();

		// The lines stay above the reserved strip
		const marks = [...container.querySelectorAll("svg polyline")].flatMap((p) =>
			p
				.getAttribute("points")!
				.split(" ")
				.map((pt) => Number(pt.split(",")[1])),
		);
		for (let y of marks) {
			expect(y).toBeLessThanOrEqual(140);
		}

		// The x axis' labels hang just under its line, with a small buffer,
		// at the top of the strip (the axis draws the same names as the
		// categories)
		const labels = [...container.querySelectorAll("svg text")].filter(
			(t) =>
				["Alpha", "Beta"].includes(t.textContent?.trim() ?? "") &&
				t.getAttribute("dominant-baseline") === "text-after-edge",
		);
		expect(labels.length).toBe(2);
		for (let label of labels) {
			expect(Number(label.getAttribute("y"))).toBe(160);
		}

		// The legend's entries anchor to the bottom of the chart, below the
		// labels, so the two don't overlap
		const legend = [...container.querySelectorAll("svg text")].filter(
			(t) =>
				["Alpha", "Beta"].includes(t.textContent?.trim() ?? "") &&
				t.getAttribute("dominant-baseline") === "middle",
		);
		expect(legend.map((t) => t.textContent?.trim())).toEqual(["Alpha", "Beta"]);
		for (let entry of legend) {
			expect(Number(entry.getAttribute("y"))).toBeGreaterThanOrEqual(172);
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

		// ...with a small gap between the segments, so the stack reads
		for (let slot of [slot0, slot1]) {
			const sorted = slot.sort((a, b) => Number(a.getAttribute("y")) - Number(b.getAttribute("y")));
			for (let i = 1; i < sorted.length; i++) {
				const lower = sorted[i - 1]!;
				const upper = sorted[i]!;
				const lowerBottom = Number(lower.getAttribute("y")) + Number(lower.getAttribute("height"));
				expect(Number(upper.getAttribute("y")) - lowerBottom).toBeCloseTo(2);
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

		// The sub-columns within a slot are separated by a gap
		const sorted = columns.sort(
			(a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")),
		);
		for (let i = 1; i < sorted.length; i++) {
			const left = sorted[i - 1]!;
			const right = sorted[i]!;
			const leftRight = Number(left.getAttribute("x")) + Number(left.getAttribute("width"));
			if (leftRight <= Number(right.getAttribute("x"))) {
				expect(Number(right.getAttribute("x")) - leftRight).toBeGreaterThan(5);
			}
		}

		// Without stacking, the domain is the largest single value (60)
		const ticks = [...container.querySelectorAll("svg text")].map((t) => t.textContent?.trim());
		expect(ticks).toContain("30");
		expect(ticks).toContain("60");
		expect(ticks).not.toContain("200");
	});

	it("the x axis title sits below its labels", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StackedChartTest as any, { stacked: false });
		await settle();

		const title = [...container.querySelectorAll("svg text")].find(
			(t) => t.textContent?.trim() === "Quarter",
		);
		const labels = [...container.querySelectorAll("svg text")].filter((t) =>
			["Q1", "Q2"].includes(t.textContent?.trim() ?? ""),
		);
		expect(title).not.toBeNull();
		expect(labels.length).toBe(2);

		// The labels' row is above the title's row, with room to spare
		for (let label of labels) {
			const labelY = Number(label.getAttribute("y"));
			const titleY = Number(title!.getAttribute("y"));
			expect(titleY - labelY).toBeGreaterThanOrEqual(24);
		}
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

	it("PieChart draws slice labels and an inset key", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, PieChart as any, {
			size: 200,
			data: [
				{ name: "Item1", value: 35 },
				{ name: "Item2", value: 25 },
				{ name: "Item3", value: 45 },
			],
			labels: true,
			legend: true,
		});
		await settle();

		// The key lists each slice down the right, with a swatch
		const key = [...container.querySelectorAll("svg text")].filter((t) =>
			["Item1", "Item2", "Item3"].includes(t.textContent?.trim() ?? ""),
		);
		expect(key.map((t) => t.textContent?.trim())).toEqual(["Item1", "Item2", "Item3"]);
		expect(container.querySelectorAll("svg rect[width='10']").length).toBe(3);

		// Each slice carries its name and value
		const labels = [...container.querySelectorAll("svg text")]
			.map((t) => t.textContent?.trim())
			.filter((t) => t?.includes(" "));
		expect(labels).toContain("Item1 35");
		expect(labels).toContain("Item2 25");
		expect(labels).toContain("Item3 45");
	});

	it("line charts line the x labels up with the points", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, LineChartTest as any, {});
		await settle();

		// Lines spread their points from the plot's left edge to its right,
		// so the labels sit at the points: the first starts at the plot's
		// left edge, the last ends at its right edge
		const labels = [...container.querySelectorAll("svg text")].filter(
			(t) => t.getAttribute("dominant-baseline") === "text-after-edge",
		);
		expect(labels.map((l) => l.getAttribute("x"))).toEqual(["36", "400"]);
		expect(labels.map((l) => l.getAttribute("text-anchor"))).toEqual(["start", "end"]);

		// ...with a buffer between the labels and the axis line at 176
		for (let label of labels) {
			expect(Number(label.getAttribute("y"))).toBeGreaterThanOrEqual(180);
		}
	});

	it("column charts keep the x labels centered in their slots", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, ColumnChartTest as any, {});
		await settle();

		// Columns are slot marks, so the labels stay centered in their
		// slots rather than moving to the plot edges
		const labels = [...container.querySelectorAll("svg text")].filter(
			(t) => t.getAttribute("dominant-baseline") === "text-after-edge",
		);
		expect(labels.map((l) => l.getAttribute("text-anchor"))).toEqual(["middle", "middle"]);
	});

	it("stacked areas sit on top of the series below them", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StackedAreaChartTest as any, {});
		await settle();

		const polygons = [...container.querySelectorAll("svg polygon")];
		expect(polygons.length).toBe(2);

		// Series A runs from the baseline: its area closes along the bottom
		// of the plot (176)
		const first = polygons[0]!
			.getAttribute("points")!
			.split(" ")
			.map((pt) => pt.split(",").map(Number));
		expect(first[0]).toEqual([36, 130.4]);
		expect(first[first.length - 1]![1]).toBeCloseTo(176);

		// Series B stacks on top: its area starts where A's top edge is
		// (30 units up) and closes back along A's top edge
		const second = polygons[1]!
			.getAttribute("points")!
			.split(" ")
			.map((pt) => pt.split(",").map(Number));
		expect(second[0]).toEqual([36, 100]);
		expect(second[second.length - 1]![1]).toBeCloseTo(130.4);
	});

	it("stacked bars lay each band's values end to end", async () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		mount(container, StackedBarChartTest as any, {});
		await settle();

		const bars = [...container.querySelectorAll("svg rect")];
		expect(bars.length).toBe(4);

		// Two segments per band, at the same y
		const band0 = bars.filter((b) => Number(b.getAttribute("y")) < 100);
		expect(band0.length).toBe(2);
		expect(new Set(band0.map((b) => b.getAttribute("y"))).size).toBe(1);

		// The second segment starts where the first ends (35 units along)
		const sorted = band0.sort((a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")));
		const firstEnd =
			Number(sorted[0]!.getAttribute("x")) + Number(sorted[0]!.getAttribute("width"));
		expect(Number(sorted[1]!.getAttribute("x")) - firstEnd).toBeLessThan(1);
		expect(Number(sorted[0]!.getAttribute("x"))).toBe(28);

		// ...flush, with no gaps between the segments
		const widths = sorted.map((b) => Number(b.getAttribute("width")));
		expect(widths[0]).toBeCloseTo(35 * 3.72);
		expect(widths[1]).toBeCloseTo(50 * 3.72);
	});
});
