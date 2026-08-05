import { type IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { describe, expect, test } from "vite-plus/test";
import flattenHeaders from "../src/server/connect/flattenHeaders";
import nodeMessageToNodeResponse from "../src/server/connect/nodeMessageToNodeResponse";
import requestToNodeMessage from "../src/server/connect/requestToNodeMessage";

describe("flattenHeaders", () => {
	test("returns a Headers init with string values", () => {
		const out = flattenHeaders({ a: "1", b: "2" }) as Headers;
		expect(out.get("a")).toBe("1");
		expect(out.get("b")).toBe("2");
	});

	test("drops undefined and null values", () => {
		const out = flattenHeaders({ a: undefined, b: null as any, c: "x" }) as Headers;
		expect(out.has("a")).toBe(false);
		expect(out.has("b")).toBe(false);
		expect(out.get("c")).toBe("x");
	});

	test("stringifies numeric values", () => {
		const out = flattenHeaders({ "content-length": 42 as any }) as Headers;
		expect(out.get("content-length")).toBe("42");
	});

	test("appends each entry of an array-valued header (regression: used to append whole array N times)", () => {
		const out = flattenHeaders({ "set-cookie": ["a=1", "b=2", "c=3"] }) as Headers;
		// Headers.get returns them joined by ", " — but getSetCookie returns array
		const all = out.getSetCookie();
		expect(all).toEqual(["a=1", "b=2", "c=3"]);
	});

	test("skips nullish entries inside an array", () => {
		const out = flattenHeaders({
			"x-multi": ["keep", null as any, undefined as any, "drop"],
		}) as Headers;
		// Headers joins multi-values; get returns "keep, drop"
		expect(out.get("x-multi")).toBe("keep, drop");
	});

	test("returns an empty Headers for an empty object", () => {
		const out = flattenHeaders({}) as Headers;
		expect(Array.from(out.entries())).toEqual([]);
	});
});

describe("requestToNodeMessage", () => {
	test("returns an IncomingMessage-shaped object", () => {
		const req = new Request("https://example.com/foo?bar=1", {
			method: "POST",
			headers: { "x-test": "yes" },
		});
		const msg = requestToNodeMessage(req);
		expect(msg.url).toBe("/foo?bar=1");
		expect(msg.method).toBe("POST");
		expect(msg.headers).toEqual({ "x-test": "yes" });
	});

	test("handles a URL with no query", () => {
		const req = new Request("https://example.com/foo");
		const msg = requestToNodeMessage(req);
		expect(msg.url).toBe("/foo");
	});

	test("handles a root URL", () => {
		const req = new Request("https://example.com/");
		const msg = requestToNodeMessage(req);
		expect(msg.url).toBe("/");
	});

	test("body is intentionally not forwarded", async () => {
		const req = new Request("https://example.com/", {
			method: "POST",
			body: "hello",
		});
		const msg = requestToNodeMessage(req);
		// Read what the IncomingMessage produces
		const chunks: Buffer[] = [];
		for await (const c of msg as any as AsyncIterable<Buffer>) chunks.push(c);
		expect(Buffer.concat(chunks).toString()).toBe("");
		// And the underlying Request's body should still be usable
		expect(await req.text()).toBe("hello");
	});
});

describe("nodeMessageToNodeResponse", () => {
	test("captures status, headers, and body when the handler writes them", async () => {
		const req = {} as IncomingMessage;
		const { res, onReadable } = nodeMessageToNodeResponse(req);

		const ready = new Promise<{ readable: Readable; headers: any; status: number }>((resolve) => {
			onReadable((result) => resolve(result));
		});

		// Simulate a connect-style handler
		res.statusCode = 201;
		res.setHeader("content-type", "text/plain");
		res.end("hello world");

		const { readable, headers, status } = await ready;
		expect(status).toBe(201);
		expect(headers["content-type"]).toBe("text/plain");

		const chunks: Buffer[] = [];
		for await (const c of readable) chunks.push(c as Buffer);
		expect(Buffer.concat(chunks).toString()).toBe("hello world");
	});

	test("captures an empty body when nothing is written", async () => {
		const req = {} as IncomingMessage;
		const { res, onReadable } = nodeMessageToNodeResponse(req);

		const ready = new Promise<{ readable: Readable; headers: any; status: number }>((resolve) => {
			onReadable((result) => resolve(result));
		});

		res.statusCode = 204;
		res.end();

		const { readable, status } = await ready;
		expect(status).toBe(204);

		const chunks: Buffer[] = [];
		for await (const c of readable) chunks.push(c as Buffer);
		expect(Buffer.concat(chunks).toString()).toBe("");
	});

	test("writeHead applies status and headers", async () => {
		const req = {} as IncomingMessage;
		const { res, onReadable } = nodeMessageToNodeResponse(req);

		const ready = new Promise<{ readable: Readable; headers: any; status: number }>((resolve) => {
			onReadable((result) => resolve(result));
		});

		(res as ServerResponse).writeHead(302, { location: "/x" } as any);
		res.end();

		const { headers, status } = await ready;
		expect(status).toBe(302);
		expect(headers["location"]).toBe("/x");
	});
});
