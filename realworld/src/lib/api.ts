//const base = 'https://api.realworld.io/api';
//const base = "http://localhost:3000/api";
const base = "http://localhost:7059/api";

interface SendOptions {
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	data?: any;
	token?: string;
}

// TODO: Make this all type-safe

async function send({ method, path, data, token }: SendOptions) {
	console.log("getting api data from", path);

	interface RequestOptions {
		method: string;
		headers: Headers;
		body?: string;
	}

	const options: RequestOptions = {
		method,
		headers: new Headers(),
	};

	if (data) {
		options.headers.append("Content-Type", "application/json");
		options.body = JSON.stringify(data);
	}

	if (token) {
		options.headers.append("Authorization", `Token ${token}`);
	}

	const result = await fetch(`${base}/${path}`, options);
	if (result.ok || result.status === 422) {
		const text = await result.text();
		return text ? JSON.parse(text) : {};
	}

	throw new Error(result.status.toString());
}

export function get(path: string, token?: string) {
	return send({ method: "GET", path, token });
}

export function del(path: string, token?: string) {
	return send({ method: "DELETE", path, token });
}

export function post(path: string, data: any, token?: string) {
	return send({ method: "POST", path, data, token });
}

export function put(path: string, data: any, token?: string) {
	return send({ method: "PUT", path, data, token });
}
