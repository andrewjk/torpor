import { $run } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import { createChartLayout } from "../../src/utils/chartLayout";

describe("chart layout", () => {
	it("reserves space on a side and computes the plot rect", () => {
		const layout = createChartLayout({
			series: () => [{ name: "A", color: "", data: [5] }],
		});
		layout.setTextSize(8, 16);

		// With no claims, marks use the whole svg
		expect(layout.plotX).toBe(0);
		expect(layout.plotWidth).toBe(400);
		expect(layout.plotHeight).toBe(200);

		const seen: number[] = [];
		$run(() => {
			seen.push(layout.plotX);
		});

		layout.reserve("yaxis", "left", 36);
		expect(layout.reservedLeft).toBe(36);
		expect(layout.plotX).toBe(36);
		expect(layout.plotWidth).toBe(364);

		// Effects that read the plot rect re-run on the claim
		expect(seen).toEqual([0, 36]);

		layout.reserve("legend", "bottom", 36);
		expect(layout.reservedBottom).toBe(36);
		expect(layout.plotHeight).toBe(200 - 36);

		// Releasing gives the space back. (The legend's claim also bumps the
		// claims version, so the effect re-runs even though plotX didn't
		// change -- it re-runs on any claim change.)
		layout.release("yaxis");
		expect(layout.reservedLeft).toBe(0);
		expect(seen).toEqual([0, 36, 36, 0]);
	});

	it("per side, the largest claim wins", () => {
		const layout = createChartLayout({
			series: () => [{ name: "A", color: "", data: [5] }],
		});

		layout.reserve("a", "left", 10);
		layout.reserve("b", "left", 30);
		expect(layout.reservedLeft).toBe(30);

		// A smaller claim doesn't shrink the side, and no-ops don't notify
		layout.reserve("c", "left", 20);
		expect(layout.reservedLeft).toBe(30);

		layout.release("b");
		expect(layout.reservedLeft).toBe(20);
	});

	it("announceMax raises the value domain", () => {
		const layout = createChartLayout({
			series: () => [{ name: "A", color: "", data: [50] }],
		});
		expect(layout.maxValue).toBe(50);

		const seen: number[] = [];
		$run(() => {
			seen.push(layout.maxValue);
		});

		layout.announceMax("columns", 120);
		expect(layout.maxValue).toBe(120);
		expect(seen).toEqual([50, 120]);

		// An explicit maxValue wins over announced stacks
		const fixed = createChartLayout({
			series: () => [{ name: "A", color: "", data: [50] }],
			maxValue: () => 100,
		});
		fixed.announceMax("columns", 120);
		expect(fixed.maxValue).toBe(100);
	});
});
