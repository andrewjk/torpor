import { describe, expect, test } from "vite-plus/test";
import CookieHelper from "../src/server/CookieHelper";

function requestWithCookies(cookieHeader: string): Request {
	return new Request("https://example.com/", { headers: { cookie: cookieHeader } });
}

describe("CookieHelper", () => {
	test("reads a cookie from the request Cookie header", () => {
		const req = requestWithCookies("session=abc; theme=dark");
		const c = new CookieHelper(req);
		expect(c.get("session")).toBe("abc");
		expect(c.get("theme")).toBe("dark");
	});

	test("returns undefined for missing cookies", () => {
		const req = requestWithCookies("a=1");
		const c = new CookieHelper(req);
		expect(c.get("missing")).toBeUndefined();
	});

	test("returns undefined when there is no Cookie header", () => {
		const req = new Request("https://example.com/");
		const c = new CookieHelper(req);
		expect(c.get("anything")).toBeUndefined();
	});

	test("set stores a cookie in the internal map; get reads it back", () => {
		const req = new Request("https://example.com/");
		const c = new CookieHelper(req);
		c.set("token", "xyz");
		expect(c.get("token")).toBe("xyz");
	});

	test("set overrides a request cookie", () => {
		const req = requestWithCookies("token=old");
		const c = new CookieHelper(req);
		c.set("token", "new");
		expect(c.get("token")).toBe("new");
	});

	test("set applies secure defaults: HttpOnly, Secure, SameSite=Lax", () => {
		const req = new Request("https://example.com/");
		const c = new CookieHelper(req);
		c.set("token", "v");
		const serialized = c.cookies.get("token")!;
		expect(serialized).toMatch(/HttpOnly/i);
		expect(serialized).toMatch(/Secure/i);
		expect(serialized).toMatch(/SameSite=Lax/i);
	});

	test("set allows overriding the defaults", () => {
		const req = new Request("https://example.com/");
		const c = new CookieHelper(req);
		c.set("token", "v", { httpOnly: false, secure: false, sameSite: "strict" });
		const serialized = c.cookies.get("token")!;
		expect(serialized).not.toMatch(/HttpOnly/i);
		expect(serialized).not.toMatch(/Secure/i);
		expect(serialized).toMatch(/SameSite=Strict/i);
	});

	test("delete clears the value and sets an immediate expiry", () => {
		const req = new Request("https://example.com/");
		const c = new CookieHelper(req);
		c.delete("token");
		const serialized = c.cookies.get("token")!;
		expect(serialized).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
		// The value should be empty
		expect(c.get("token")).toBe("");
	});

	test("delete carries secure defaults through to the Set-Cookie header", () => {
		const req = new Request("https://example.com/");
		const c = new CookieHelper(req);
		c.delete("token");
		const serialized = c.cookies.get("token")!;
		expect(serialized).toMatch(/HttpOnly/i);
		expect(serialized).toMatch(/Secure/i);
	});
});
