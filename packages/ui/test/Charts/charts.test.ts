import "./svgPolyfill";
import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom/vitest";
import { mount } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import BarChartTest from "./components/BarChartTest.torp";
import ColumnChartTest from "./components/ColumnChartTest.torp";
import LineChartTest from "./components/LineChartTest.torp";

const tick = () => new Promise((r) => setTimeout(r));
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
});
