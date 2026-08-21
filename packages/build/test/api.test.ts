import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import makeApi from "../src/nav/api";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
	fetchMock.mockReset();
});

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("makeApi", () => {
	test("calls the endpoint with the right method and url", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ time: 123 }));
		const api = makeApi<string, any>("/api/time");
		const result = await api.get();
		expect(fetchMock).toHaveBeenCalledWith("/api/time", expect.objectContaining({ method: "GET" }));
		expect(result).toEqual({ time: 123 });
	});

	test("fills in params from the route path", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<"/api/posts/[id]", any>("/api/posts/[id]", { id: "5" });
		await api.get();
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/posts/5",
			expect.objectContaining({ method: "GET" }),
		);
	});

	test("sends object bodies as JSON", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/posts");
		await api.post({ title: "Hello" });
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/posts");
		expect(options.method).toBe("POST");
		expect(options.body).toBe('{"title":"Hello"}');
		expect(options.headers["Content-Type"]).toBe("application/json");
	});

	test("passes string bodies through as-is", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/echo");
		await api.post("raw text");
		const [, options] = fetchMock.mock.calls[0];
		expect(options.body).toBe("raw text");
		expect(options.headers).toBeUndefined();
	});

	test("does not attach a body to GET or HEAD requests", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time");
		await api.get({ unwanted: true });
		const [, options] = fetchMock.mock.calls[0];
		expect(options.body).toBeUndefined();
	});

	test("resolves to the raw Response for non-JSON bodies", async () => {
		const raw = new Response("plain", {
			status: 200,
			headers: { "Content-Type": "text/plain" },
		});
		fetchMock.mockResolvedValue(raw);
		const api = makeApi<string, any>("/api/text");
		const result = await api.get();
		expect(result).toBe(raw);
	});

	test("throws for failed requests", async () => {
		fetchMock.mockResolvedValue(new Response("Not found", { status: 404 }));
		const api = makeApi<string, any>("/api/missing");
		await expect(api.get()).rejects.toThrow("404");
	});

	test("translates del to DELETE", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/posts");
		await api.del();
		const [, options] = fetchMock.mock.calls[0];
		expect(options.method).toBe("DELETE");
	});

	test("allows init to override options", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time");
		await api.get(undefined, { headers: { Authorization: "Bearer token" } });
		const [, options] = fetchMock.mock.calls[0];
		expect(options.headers).toEqual({ Authorization: "Bearer token" });
	});
});
