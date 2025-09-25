export default interface Page {
	status: number;
	url: URL;
	form?: Record<string, string>;
	error?: {
		message: string;
	};
}
