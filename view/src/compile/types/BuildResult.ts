export default interface BuildResult {
	code: string;
	styles: {
		style: string;
		hash: string;
	}[];
}
