import type DataSeries from "../Charts/DataSeries";

export function calculateMaxValue(series: DataSeries[]): number {
	// HACK: Yeah, nested reduces
	return series.reduce((a, b) => {
		return Math.max(
			a,
			b.data.reduce((c, d) => Math.max(c, d), 0),
		);
	}, 0);
}

export function calculateStepValue(range: number, stepCount = 2): number {
	// Get the closest half-power of 10 e.g. for 35 or 75 it would be 50
	let maxUpper = parseInt(
		"5" + Array.prototype.join.call({ length: range.toString().length }, "0"),
	);
	// Start with the naive step value
	let step = range / stepCount;
	// Make it a decimal value and round it up
	step = Math.ceil(step / (maxUpper / 10));
	// If the step would be a multiple of 3, 7 or 9, round it up to the next
	// even number (for aesthetic purposes)
	if (step === 3 || step === 7 || step === 9) {
		step = step + (step % 2);
	}
	// Convert the step back from the decimal value
	step = step * (maxUpper / 10);
	return step;
}

export function calculateStepLabels(stepCount: number, stepValue: number): number[] {
	// Calculate the step value and labels
	const newStepLabels: number[] = [];
	for (var i = 0; i < stepCount + 1; i++) {
		newStepLabels.push(stepValue * i);
	}
	return newStepLabels;
}

export function calculateItemWidth(plotWidth: number, labels: string[]): number {
	return plotWidth / labels.length;
}

export function calculateValueHeight(
	plotHeight: number,
	textHeight: number,
	stepValue: number,
	stepCount: number,
): number {
	// A little headroom above the tallest mark
	return (plotHeight - textHeight) / (stepValue * stepCount);
}

/**
 * The width needed by a row of numeric tick labels, approximated from the
 * measured width of a "0" character.
 */
export function calculateTickLabelWidth(stepLabels: number[], textWidth: number): number {
	const maxLabelLength = stepLabels.reduce((a, b) => Math.max(a, b.toString().length), 0);
	return maxLabelLength * textWidth;
}

/**
 * The domain top needed by stacked marks: the largest sum of the values in
 * one slot across all series.
 */
export function calculateStackMax(series: DataSeries[]): number {
	let max = 0;
	for (const s of series) {
		const total = s.data.reduce((a, b) => a + b, 0);
		if (total > max) {
			max = total;
		}
	}
	return max;
}

export function calculateChartBottom(xLabel: string, height: number, textHeight: number): number {
	return xLabel ? height - textHeight * 2 : height - textHeight;
}

export function calculateChartLeft(
	stepLabels: number[],
	yLabel: string,
	textHeight: number,
	textWidth: number,
): number {
	// Get the longest label width
	const maxLabelWidth = stepLabels.reduce((a, b) => {
		return Math.max(a.toString().length, b.toString().length);
	}, 0);
	let theChartLeft = yLabel ? textHeight * 1.5 : textHeight / 2;
	theChartLeft += maxLabelWidth * textWidth;
	return theChartLeft;
}
