export default interface PageParams {
	url: URL;
	params: Record<string, string>;
	data: Record<string, any>;
}
