export default class ServerEvent {
	request: Request;
	response?: Response;
	// TODO: Should we cast types??
	params?: { [key: string]: string };

	constructor(request: Request, params?: { [key: string]: string }) {
		this.request = request;
		this.params = params;
	}
}
