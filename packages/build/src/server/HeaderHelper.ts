export default class HeaderHelper {
	request: Request;
	headers: Map<string, string> = new Map();

	constructor(request: Request) {
		this.request = request;
	}

	get(name: string): string | undefined {
		// If it's been set, return the updated value
		if (this.headers.has(name)) {
			return this.headers.get(name);
		}
		// Otherwise, return the value from the header
		return this.request.headers.get(name) ?? undefined;
	}

	set(name: string, value: string) {
		this.headers.set(name, value);
	}

	delete(name: string) {
		this.headers.delete(name);
	}
}
