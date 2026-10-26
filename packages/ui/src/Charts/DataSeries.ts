export default interface DataSeries {
	name: string;
	/** The color to draw the series with (default: the next palette color) */
	color?: string;
	data: number[];
}
