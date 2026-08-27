import type DataSeries from "./DataSeries";
import { type ChartLayout } from "../utils/chartLayout";

export const ChartContextName: unique symbol = Symbol.for("torp.Chart");

/**
 * The shared context for layered chart components (ChartXAxis, ChartYAxis,
 * ChartGrid, ChartColumns etc), published by the Chart container.
 */
export interface ChartContext {
	/** The plot geometry: margins, scales and derived positions */
	layout: ChartLayout;
	/** The series that layers draw from */
	series: () => DataSeries[];
	/** The label under the x axis, if any */
	xLabel: () => string;
	/** The label beside the y axis, if any */
	yLabel: () => string;
	/** The color to draw series i with, from its own color or the palette */
	colorAt: (i: number) => string;
}

