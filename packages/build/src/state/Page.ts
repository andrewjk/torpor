export default interface Page {
	status: number;
	url: URL;
	error: {
		message: string;
	};
}
