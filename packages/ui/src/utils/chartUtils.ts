import type DataSeries from "../Chart/DataSeries";

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

export function calculateItemWidth(width: number, chartLeft: number, labels: string[]): number {
	return (width - chartLeft) / labels.length;
}

export function calculateValueHeight(
	chartBottom: number,
	textHeight: number,
	stepValue: number,
	stepCount: number,
): number {
	return (chartBottom - textHeight) / (stepValue * stepCount);
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
