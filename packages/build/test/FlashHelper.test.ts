import { describe, expect, test } from "vite-plus/test";
import CookieHelper from "../src/server/CookieHelper";
import FlashHelper from "../src/server/FlashHelper";

function makeFlash(cookie: string | undefined): { flash: FlashHelper; cookies: CookieHelper } {
	const headers = new Headers();
	if (cookie) headers.set("Cookie", cookie);
	const cookies = new CookieHelper(new Request("http://localhost/", { headers }));
	return { flash: new FlashHelper(cookies), cookies };
}

/** The value of a set torpor-flash cookie from the serialized header */
function writtenValue(cookies: CookieHelper): string | undefined {
	const entry = [...cookies.cookies.values()].find((c) =>
		/^torpor-flash=.+$/.test(c.split(";")[0]),
	);
	if (!entry) return undefined;
	return entry.split(";")[0].slice("torpor-flash=".length);
}

function hasDeletion(cookies: CookieHelper): boolean {
	return [...cookies.cookies.values()].some((c) => c.startsWith("torpor-flash=;"));
}

describe("FlashHelper", () => {
	test("get returns undefined when there is no cookie", () => {
		const { flash } = makeFlash(undefined);
		expect(flash.get()).toBeUndefined();
	});

	test("set with a string shorthand stores { message }", () => {
		const { flash, cookies } = makeFlash(undefined);
		flash.set("Project saved");
		// A fresh helper, as on the next request
		const next = makeFlash(`torpor-flash=${writtenValue(cookies)}`).flash;
		expect(next.get()).toEqual({ message: "Project saved" });
	});

	test("set with an object stores the values as-is", () => {
		const { flash, cookies } = makeFlash(undefined);
		flash.set({ error: "Import failed", count: 0, retryable: true });
		const next = makeFlash(`torpor-flash=${writtenValue(cookies)}`).flash;
		expect(next.get()).toEqual({ error: "Import failed", count: 0, retryable: true });
	});

	test("get issues the deletion cookie, so the message shows once", () => {
		const { flash, cookies } = makeFlash(undefined);
		flash.set("Project saved");
		const next = makeFlash(`torpor-flash=${writtenValue(cookies)}`);
		next.flash.get();
		expect(hasDeletion(next.cookies)).toBe(true);
	});

	test("set then get in the same request consumes the message invisibly", () => {
		const { flash, cookies } = makeFlash(undefined);
		flash.set("Project saved");
		expect(flash.get()).toEqual({ message: "Project saved" });
		// The pending cookie was overwritten by the deletion
		expect(hasDeletion(cookies)).toBe(true);
		expect(writtenValue(cookies)).toBeUndefined();
	});

	test("a malformed cookie reads as no message", () => {
		const flash = makeFlash(`torpor-flash=${encodeURIComponent("not json{{")}`).flash;
		expect(flash.get()).toBeUndefined();
	});

	test("a cookie whose value isn't a plain object reads as no message", () => {
		for (const value of ["[1,2]", "5", "null", '"text"']) {
			const flash = makeFlash(`torpor-flash=${encodeURIComponent(value)}`).flash;
			expect(flash.get()).toBeUndefined();
		}
	});

	test("values are JSON-safe with unicode", () => {
		const { flash, cookies } = makeFlash(undefined);
		flash.set({ message: "Something's up — 破損" });
		const next = makeFlash(`torpor-flash=${writtenValue(cookies)}`).flash;
		expect(next.get()).toEqual({ message: "Something's up — 破損" });
	});
});
