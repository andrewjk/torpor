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
		let nextCalled = false;
		await mw(ev, async () => {
			nextCalled = true;
		});
		expect(ev.response).toBeInstanceOf(Response);
		expect(ev.response!.status).toBe(200);
		expect(await ev.response!.text()).toBe("hello");
		expect(ev.response!.headers.get("content-type")).toBe("text/plain");
		// Connect handler called next(); the wrapped middleware then runs the
		// web `next` callback to signal it's done
		expect(nextCalled).toBe(true);
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
		await mw(ev, async () => {});
		expect(seen.method).toBe("POST");
		expect(seen.url).toBe("/foo?bar=1");
	});

	test("rejects when the handler calls next with an error", async () => {
		const mw = connectMiddleware((_req, _res, next) => {
			next(new Error("kaboom"));
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		await expect(mw(ev, async () => {})).rejects.toThrow(/kaboom/);
	});

	test("rejects when the handler throws", async () => {
		const mw = connectMiddleware(() => {
			throw new Error("thrown");
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		await expect(mw(ev, async () => {})).rejects.toThrow(/thrown/);
	});

	test("resolves without calling web next() when handler returns false", async () => {
		const mw = connectMiddleware((_req, res) => {
			res.end();
			return false;
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		let nextCalled = false;
		await mw(ev, async () => {
			nextCalled = true;
		});
		expect(nextCalled).toBe(false);
		expect(ev.response).toBeInstanceOf(Response);
	});

	test("carries multi-value Set-Cookie headers through flattenHeaders", async () => {
		const mw = connectMiddleware((_req, res, next) => {
			res.setHeader("set-cookie", ["a=1", "b=2", "c=3"]);
			res.end();
			next();
		});
		const ev = new ServerEvent(new Request("https://example.com/"));
		await mw(ev, async () => {});
		const setCookies = ev.response!.headers.getSetCookie();
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
		await mw(ev, async () => {});
		expect(ev.response!.status).toBe(204);
		expect(ev.response!.body).toBeNull();
	});
});
