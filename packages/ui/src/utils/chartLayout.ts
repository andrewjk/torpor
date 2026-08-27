import { $watch } from "@torpor/view";
import type DataSeries from "../Charts/DataSeries";
import {
	calculateChartBottom,
	calculateChartLeft,
	calculateItemWidth,
	calculateMaxValue,
	calculateStepLabels,
	calculateStepValue,
	calculateValueHeight,
} from "./chartUtils";

export interface ChartLayoutOptions {
	/** The named series to lay out */
	series: () => DataSeries[];
	/** Fixed height, if any (default 200 or the container's client height) */
	height?: () => number | undefined;
	/** Fixed width, if any (default 400 or the container's client width) */
	width?: () => number | undefined;
	/** Label under the x axis */
	xLabel?: () => string | undefined;
	/** Label beside the y axis */
	yLabel?: () => string | undefined;
	/** The value at the top of the chart, instead of the series' maximum */
	maxValue?: () => number | undefined;
	/** The number of steps between 0 and the maximum value (default 2) */
	stepCount?: () => number | undefined;
	/** The size of each step, instead of being calculated */
	stepValue?: () => number | undefined;
	/** The container element, used to measure responsive widths */
	getContainer?: () => HTMLElement | undefined;
}

/**
 * The shared layout scaffold behind the cartesian charts (Bar, Column,
 * Line): measures the chart's text so labels can be sized, and calculates
 * the plot geometry -- maximum value, step sizes, slot widths and the
 * left/bottom margins -- reactively from the series and axis props.
 *
 * Charts render only their own marks; call `measure` from `$mount` with the
 * hidden `<text>` element they render for that purpose.
 *
 * ```
 * let $layout = createChartLayout({
 * 	series: () => $props.series,
 * 	getContainer: () => container,
 * });
 * $mount(() => setTimeout(() => measure($layout, measurer), 1));
 * ```
 */
export interface ChartLayout {
	/** The width of the chart's text, measured from the measurer element */
	textWidth: number;
	/** The height of the chart's text (1.5x the measurer's box) */
	textHeight: number;
	/** The series names, rendered along the x axis */
	readonly labels: string[];
	readonly calculatedHeight: number;
	readonly calculatedWidth: number;
	/** The largest value across all series, unless overridden */
	readonly maxValue: number;
	/** The size of one y axis step */
	readonly stepValue: number;
	/** The labels for each step, 0 through max */
	readonly stepLabels: number[];
	/** The width of one category slot */
	readonly itemWidth: number;
	/** The pixel height of one unit of value */
	readonly valueHeight: number;
	/** The bottom edge of the plot area */
	readonly chartBottom: number;
	/** The left edge of the plot area */
	readonly chartLeft: number;
	setTextSize(width: number, height: number): void;
}

export function createChartLayout(options: ChartLayoutOptions): ChartLayout {
	const defaultHeight = 200;
	const defaultWidth = 400;
	const getStepCount = () => options.stepCount?.() ?? 2;

	return $watch({
		textWidth: 0,
		textHeight: 0,

		get labels() {
			return options.series().map((s) => s.name);
		},
		get calculatedHeight() {
			return options.height?.() || defaultHeight;
		},
		get calculatedWidth() {
			return options.width?.() || options.getContainer?.()?.clientWidth || defaultWidth;
		},
		get maxValue() {
			return options.maxValue?.() || calculateMaxValue(options.series());
		},
		get stepValue() {
			return (
				options.stepValue?.() ||
				calculateStepValue(this.maxValue, options.stepCount?.())
			);
		},
		get stepLabels() {
			return calculateStepLabels(getStepCount(), this.stepValue);
		},
		get itemWidth() {
			return calculateItemWidth(this.calculatedWidth, this.chartLeft, this.labels);
		},
		get valueHeight() {
			return calculateValueHeight(
				this.chartBottom,
				this.textHeight,
				this.stepValue,
				getStepCount(),
			);
		},
		get chartBottom() {
			return calculateChartBottom(
				options.xLabel?.() ?? "",
				this.calculatedHeight,
				this.textHeight,
			);
		},
		get chartLeft() {
			return calculateChartLeft(
				this.stepLabels,
				options.yLabel?.() ?? "",
				this.textHeight,
				this.textWidth,
			);
		},

		setTextSize(width: number, height: number) {
			this.textWidth = width;
			this.textHeight = height * 1.5;
		},
	});
}

/**
 * Reads the size of a hidden measurer `<text>` element into the layout
 * state and removes it. Call once the element is in the document (from
 * `$mount`, deferred a tick).
 */
export function measureChartText(
	layout: ChartLayout,
	measurer: SVGTextElement,
): void {
	const bbox = measurer.getBBox();
	layout.setTextSize(bbox.width, bbox.height);
	measurer.remove();
}
