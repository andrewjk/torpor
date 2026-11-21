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

	test("serializes GET arguments as query params, never a body", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time");
		await api.get({ sort: "asc", limit: 10, active: true });
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/time?sort=asc&limit=10&active=true");
		expect(options.body).toBeUndefined();
	});

	test("repeats array values, skips empty ones, and encodes values", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/search");
		await api.get({
			tag: ["a b", "c"],
			empty: undefined,
			none: null,
			q: "a&b=c",
			when: new Date("2026-01-02T03:04:05.000Z"),
		});
		const [url] = fetchMock.mock.calls[0];
		const params = new URL(url, "http://localhost").searchParams;
		expect(params.getAll("tag")).toEqual(["a b", "c"]);
		expect(params.has("empty")).toBe(false);
		expect(params.has("none")).toBe(false);
		expect(params.get("q")).toBe("a&b=c");
		expect(params.get("when")).toBe("2026-01-02T03:04:05.000Z");
	});

	test("appends to a query string already in the path", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time?x=1");
		await api.get({ y: 2 });
		expect(fetchMock.mock.calls[0][0]).toBe("/api/time?x=1&y=2");
	});

	test("HEAD queries are serialized the same way", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time");
		await api.head({ a: 1 });
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/time?a=1");
		expect(options.method).toBe("HEAD");
		expect(options.body).toBeUndefined();
	});

	test("rejects query values that can't be serialized", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time");
		await expect(api.get({ filter: { nested: 1 } as any })).rejects.toThrow(/Cannot serialize/);
	});

	test("rejects a non-object query", async () => {
		fetchMock.mockResolvedValue(jsonResponse({}));
		const api = makeApi<string, any>("/api/time");
		await expect(api.get("nope" as any)).rejects.toThrow(/must be an object/);
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
