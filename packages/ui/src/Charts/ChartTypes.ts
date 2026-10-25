import type DataSeries from "./DataSeries";
import { type ChartLayout, type ChartSide } from "../utils/chartLayout";

export const ChartContextName: unique symbol = Symbol.for("torp.Chart");

export type { ChartSide };

/**
 * The shared context for layered chart components (ChartXAxis, ChartYAxis,
 * ChartGrid etc), published by the Chart container.
 *
 * Furniture layers (axes, legends) reserve the space they need through the
 * layout; the plot rect is whatever is left over, and mark layers draw only
 * into that, overlapping each other freely.
 */
export interface ChartContext {
	/** The plot geometry: reservations, the plot rect, scales and derived positions */
	layout: ChartLayout;
	/** The series that layers draw from */
	series: () => DataSeries[];
	/** The label under the x axis, if any */
	xLabel: () => string;
	/** The label beside the y axis, if any */
	yLabel: () => string;
	/** Whether the chart draws horizontal marks (bars), set by the mark layers */
	horizontal: () => boolean;
	/** Called by mark layers to announce their orientation */
	registerMark: (orientation: "horizontal" | "vertical") => void;
	/** Called by aggregated mark layers (stacks) to raise the value domain */
	registerMax: (id: string, value: number) => void;
	/** The color to draw series i with, from its own color or the palette */
	colorAt: (i: number) => string;
}
