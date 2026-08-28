import { type IncomingMessage, type ServerResponse } from "node:http";
import { describe, expect, test } from "vite-plus/test";
import connectMiddleware from "../src/server/connect/connectMiddleware";
import ServerEvent from "../src/server/ServerEvent";

// A tiny Connect-style middleware that just writes a response
function textHandler(status = 200, body = "ok") {
	return (_req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
		res.statusCode = status;
		res.setHeader("content-type", "text/plain");
		res.end(body);
		next();
	};
}

describe("connectMiddleware", () => {
	test("wraps a Connect handler and produces a Response", async () => {
		const mw = connectMiddleware(textHandler(200, "hello"));
		const req = new Request("https://example.com/");
		const ev = new ServerEvent(req);
		const res = await mw.enter!(ev);
		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(200);
		expect(await res!.text()).toBe("hello");
		expect(res!.headers.get("content-type")).toBe("text/plain");
	});

	test("forwards the request method and url to the Connect handler", async () => {
		const seen: { method?: string; url?: string } = {};
		const mw = connectMiddleware((req, res, next) => {
			seen.method = req.method;
			seen.url = req.url;
			res.end();
			next();
		});
		const ev = new ServerEvent(new Request("https://example.com/foo?bar=1", { method: "POST" }));
		await mw.enter!(ev);
		expect(seen.method).toBe("POST");
		expect(seen.url).toBe("/foo?bar=1");
	});

	test("returns undefined when the handler calls next()", async () => {
		const mw = connectMiddleware((_req, _res, next) => {
			next();
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		expect(await mw.enter!(ev)).toBeUndefined();
	});

	test("rejects when the handler calls next with an error", async () => {
		const mw = connectMiddleware((_req, _res, next) => {
			next(new Error("kaboom"));
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		await expect(mw.enter!(ev)).rejects.toThrow(/kaboom/);
	});

	test("rejects when the handler throws", async () => {
		const mw = connectMiddleware(() => {
			throw new Error("thrown");
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		await expect(mw.enter!(ev)).rejects.toThrow(/thrown/);
	});

	test("returns an empty response when handler returns false", async () => {
		const mw = connectMiddleware((_req, res) => {
			res.end();
			return false;
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		const res = await mw.enter!(ev);
		expect(res).toBeInstanceOf(Response);
	});

	test("carries multi-value Set-Cookie headers through flattenHeaders", async () => {
		const mw = connectMiddleware((_req, res, next) => {
			res.setHeader("set-cookie", ["a=1", "b=2", "c=3"]);
			res.end();
			next();
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		const res = await mw.enter!(ev);
		const setCookies = res!.headers.getSetCookie();
		// Regression: previously flattened as ["a=1,b=2,c=3", "a=1,b=2,c=3", "a=1,b=2,c=3"]
		expect(setCookies).toEqual(["a=1", "b=2", "c=3"]);
	});

	test("returns a null body for status codes without a body (e.g. 204)", async () => {
		const mw = connectMiddleware((_req, res, next) => {
			res.statusCode = 204;
			res.end();
			next();
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		const res = await mw.enter!(ev);
		expect(res!.status).toBe(204);
		expect(res!.body).toBeNull();
	});
});
