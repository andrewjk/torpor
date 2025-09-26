export default interface PageState {
	status: number;
	url: URL;
	form?: Record<string, string>;
	error?: {
		message: string;
	};
}
