import { $watch } from "@torpor/view";
import type DataSeries from "../Charts/DataSeries";
import {
	calculateItemWidth,
	calculateMaxValue,
	calculateStepLabels,
	calculateStepValue,
	calculateValueHeight,
} from "./chartUtils";

/** The sides of a chart that space can be reserved on */
export type ChartSide = "top" | "right" | "bottom" | "left";

export interface ChartLayoutOptions {
	/** The named series to lay out */
	series: () => DataSeries[];
	/** Fixed height, if any (default 200 or the container's client height) */
	height?: () => number | undefined;
	/** Fixed width, if any (default 400 or the container's client width) */
	width?: () => number | undefined;
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
 * A claim on space along one side of the chart, made by an axis, legend or
 * other furniture layer via `reserve`.
 */
interface SpaceClaim {
	side: ChartSide;
	size: number;
}

/**
 * The shared layout scaffold behind the layered charts: measures the chart's
 * text so labels can be sized, and calculates the scales and the plot
 * geometry reactively from the series and the space reserved by layers.
 *
 * Furniture layers (axes, legends) claim the space they need with `reserve`;
 * the plot rect is whatever is left over, and mark layers draw only into
 * that, overlapping each other freely. Aggregated marks (stacks) raise the
 * domain with `announceMax`.
 *
 * Charts render only their own marks; call `measureChartText` from
 * `$onmount` with the hidden `<text>` element they render for that purpose.
 *
 * ```
 * let $layout = createChartLayout({
 * 	series: () => $props.series,
 * 	getContainer: () => container,
 * });
 * $onmount(() => setTimeout(() => measureChartText($layout, measurer), 1));
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
	/** The largest value across all series and announced stacks, unless overridden */
	readonly maxValue: number;
	/** The size of one y axis step */
	readonly stepValue: number;
	/** The labels for each step, 0 through max */
	readonly stepLabels: number[];
	/** The width of one category slot in the plot */
	readonly itemWidth: number;
	/** The pixel height of one unit of value */
	readonly valueHeight: number;
	/** The space reserved along the top edge (e.g. a legend) */
	readonly reservedTop: number;
	/** The space reserved along the right edge (e.g. a right y axis) */
	readonly reservedRight: number;
	/** The space reserved along the bottom edge (e.g. an x axis) */
	readonly reservedBottom: number;
	/** The space reserved along the left edge (e.g. a left y axis) */
	readonly reservedLeft: number;
	/** The left edge of the plot area */
	readonly plotX: number;
	/** The top edge of the plot area */
	readonly plotY: number;
	/** The width of the plot area */
	readonly plotWidth: number;
	/** The height of the plot area */
	readonly plotHeight: number;
	/**
	 * Claims space on a side of the plot, keyed by layer. Claims on the
	 * same side stack up; no-ops when the claim is unchanged.
	 */
	reserve(id: string, side: ChartSide, size: number): void;
	/** Gives back the space claimed by `reserve` */
	release(id: string): void;
	/**
	 * Announces the domain top that an aggregated mark layer (a stack)
	 * needs, keyed by layer. No-ops when the value is unchanged.
	 */
	announceMax(id: string, value: number): void;
	setTextSize(width: number, height: number): void;
}

export function createChartLayout(options: ChartLayoutOptions): ChartLayout {
	const defaultHeight = 200;
	const defaultWidth = 400;
	const getStepCount = () => options.stepCount?.() ?? 2;

	return $watch({
		textWidth: 0,
		textHeight: 0,

		// Space claimed by furniture layers (axes, legends), keyed by layer id
		claims: {} as Record<string, SpaceClaim>,
		// Domain tops announced by aggregated mark layers, keyed by layer id
		maxClaims: {} as Record<string, number>,
		// Bumped whenever the claims change: adding a key to a watched
		// object doesn't notify on its own, so getters that iterate them
		// read this to stay up to date
		claimsVersion: 0,
		maxVersion: 0,

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
			void this.maxVersion;
			return (
				options.maxValue?.() ||
				Math.max(
					calculateMaxValue(options.series()),
					...Object.values(this.maxClaims as Record<string, number>),
				)
			);
		},
		get stepValue() {
			return options.stepValue?.() || calculateStepValue(this.maxValue, options.stepCount?.());
		},
		get stepLabels() {
			return calculateStepLabels(getStepCount(), this.stepValue);
		},
		get itemWidth() {
			return calculateItemWidth(this.plotWidth, this.labels);
		},
		get valueHeight() {
			return calculateValueHeight(this.plotHeight, this.textHeight, this.stepValue, getStepCount());
		},

		// The reserved strips, one per side: the largest claim on that side
		get reservedTop() {
			void this.claimsVersion;
			return reservedSize(this.claims as Record<string, SpaceClaim>, "top");
		},
		get reservedRight() {
			void this.claimsVersion;
			return reservedSize(this.claims as Record<string, SpaceClaim>, "right");
		},
		get reservedBottom() {
			void this.claimsVersion;
			return reservedSize(this.claims as Record<string, SpaceClaim>, "bottom");
		},
		get reservedLeft() {
			void this.claimsVersion;
			return reservedSize(this.claims as Record<string, SpaceClaim>, "left");
		},

		// The plot rect: whatever is left over after reservations. Mark
		// layers draw into this and overlap each other freely.
		get plotX() {
			return this.reservedLeft;
		},
		get plotY() {
			return this.reservedTop;
		},
		get plotWidth() {
			return Math.max(0, this.calculatedWidth - this.reservedLeft - this.reservedRight);
		},
		get plotHeight() {
			return Math.max(0, this.calculatedHeight - this.reservedTop - this.reservedBottom);
		},

		reserve(id: string, side: ChartSide, size: number) {
			const claims = this.claims as Record<string, SpaceClaim>;
			const current = claims[id];
			if (current && current.side === side && current.size === size) return;
			claims[id] = { side, size };
			this.claimsVersion++;
		},
		release(id: string) {
			const claims = this.claims as Record<string, SpaceClaim>;
			if (!claims[id]) return;
			delete claims[id];
			this.claimsVersion++;
		},
		announceMax(id: string, value: number) {
			const claims = this.maxClaims as Record<string, number>;
			if (claims[id] === value) return;
			claims[id] = value;
			this.maxVersion++;
		},

		setTextSize(width: number, height: number) {
			this.textWidth = width;
			this.textHeight = height * 1.5;
		},
	});
}

/**
 * The total space reserved on one side: claims on the same side stack up,
 * so an x axis and a legend each keep their own band along the bottom.
 */
function reservedSize(claims: Record<string, SpaceClaim>, side: ChartSide): number {
	let total = 0;
	for (const claim of Object.values(claims)) {
		if (claim.side === side) {
			total += claim.size;
		}
	}
	return total;
}

/**
 * Reads the size of a hidden measurer `<text>` element into the layout
 * state and removes it. Call once the element is in the document (from
 * `$onmount`, deferred a tick).
 */
export function measureChartText(layout: ChartLayout, measurer: SVGTextElement): void {
	const bbox = measurer.getBBox();
	layout.setTextSize(bbox.width, bbox.height);
	measurer.remove();
}
