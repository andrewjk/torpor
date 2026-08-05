import { describe, expect, test } from "vite-plus/test";
import HeaderHelper from "../src/server/HeaderHelper";

function requestWith(headers: Record<string, string>): Request {
	return new Request("https://example.com/", { headers });
}

describe("HeaderHelper", () => {
	test("reads a header from the underlying request", () => {
		const req = requestWith({ "x-test": "hello" });
		const h = new HeaderHelper(req);
		expect(h.get("x-test")).toBe("hello");
	});

	test("reads case-insensitively from the underlying request", () => {
		const req = requestWith({ "X-Test": "hello" });
		const h = new HeaderHelper(req);
		expect(h.get("x-test")).toBe("hello");
		expect(h.get("X-TEST")).toBe("hello");
	});

	test("returns undefined for missing headers", () => {
		const req = requestWith({});
		const h = new HeaderHelper(req);
		expect(h.get("missing")).toBeUndefined();
	});

	test("set overrides the request value", () => {
		const req = requestWith({ "x-test": "old" });
		const h = new HeaderHelper(req);
		h.set("x-test", "new");
		expect(h.get("x-test")).toBe("new");
	});

	test("set adds a new header", () => {
		const req = requestWith({});
		const h = new HeaderHelper(req);
		h.set("x-test", "added");
		expect(h.get("x-test")).toBe("added");
	});

	test("delete removes a previously-set override, restoring the request value", () => {
		const req = requestWith({ "x-test": "original" });
		const h = new HeaderHelper(req);
		h.set("x-test", "override");
		expect(h.get("x-test")).toBe("override");
		h.delete("x-test");
		expect(h.get("x-test")).toBe("original");
	});

	test("delete on a header that was never set is a no-op", () => {
		const req = requestWith({ "x-test": "value" });
		const h = new HeaderHelper(req);
		h.delete("x-test");
		// No-op — request value still readable
		expect(h.get("x-test")).toBe("value");
	});

	test("exposes the underlying overrides via the `headers` map", () => {
		const req = requestWith({});
		const h = new HeaderHelper(req);
		h.set("a", "1");
		h.set("b", "2");
		expect(Object.fromEntries(h.headers.entries())).toEqual({ a: "1", b: "2" });
	});
});
