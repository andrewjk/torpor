import { describe, expect, test } from "vite-plus/test";
import {
	addBaseToPath,
	getBasePath,
	normalizeBasePath,
	setBasePath,
	stripBaseFromUrl,
	rewriteBaseInHtml,
} from "../src/site/basePath";

describe("normalizeBasePath", () => {
	test("accepts absolute paths and normalizes edge values", () => {
		expect(normalizeBasePath("/app")).toBe("/app");
		expect(normalizeBasePath("/app/")).toBe("/app"); // trailing slash stripped
		expect(normalizeBasePath("/")).toBe("");
		expect(normalizeBasePath("")).toBe("");
		expect(normalizeBasePath(undefined)).toBe("");
	});

	test("rejects non-absolute paths and spaces", () => {
		for (const value of ["app", "https://x.com/app", "/a p p"]) {
			expect(() => normalizeBasePath(value)).toThrow(/absolute path/);
		}
	});
});

describe("stripBaseFromUrl", () => {
	test("strips the base, keeping query and hash", () => {
		const url = new URL("http://x.com/app/posts/2?page=3#top");
		const stripped = stripBaseFromUrl(url, "/app")!;
		expect(stripped.pathname).toBe("/posts/2");
		expect(stripped.search).toBe("?page=3");
		expect(stripped.hash).toBe("#top");
		// The original is untouched
		expect(url.pathname).toBe("/app/posts/2");
	});

	test("the base itself maps to /", () => {
		expect(stripBaseFromUrl(new URL("http://x.com/app"), "/app")!.pathname).toBe("/");
	});

	test("URLs without the base return undefined (they aren't ours)", () => {
		expect(stripBaseFromUrl(new URL("http://x.com/other"), "/app")).toBeUndefined();
		expect(stripBaseFromUrl(new URL("http://x.com/app"), "")!.pathname).toBe("/app");
	});
});

describe("addBaseToPath", () => {
	test("prefixes absolute paths", () => {
		expect(addBaseToPath("/about", "/app")).toBe("/app/about");
		expect(addBaseToPath("/", "/app")).toBe("/app/");
	});

	test("is idempotent", () => {
		expect(addBaseToPath("/app/about", "/app")).toBe("/app/about");
	});

	test("leaves relative and external paths alone", () => {
		expect(addBaseToPath("about", "/app")).toBe("about");
		expect(addBaseToPath("//x.com/a", "/app")).toBe("//x.com/a");
		expect(addBaseToPath("/about", "")).toBe("/about");
	});
});

describe("rewriteBaseInHtml", () => {
	test("rewrites href, action and src attributes", () => {
		const html = `<a href="/about">A</a><form action="/save"><img src="/logo.svg">`;
		const rewritten = rewriteBaseInHtml(html, "/app");
		expect(rewritten).toContain('href="/app/about"');
		expect(rewritten).toContain('action="/app/save"');
		expect(rewritten).toContain('src="/app/logo.svg"');
		// Paths that already carry the base are left alone
		expect(rewriteBaseInHtml(`<a href="/app/other">x</a>`, "/app")).toContain('href="/app/other"');
	});

	test("leaves relative, external and empty values alone", () => {
		const html = `<a href="https://x.com/a">1</a><a href="//y.com/b">2</a><a href="local">3</a><a href="">4</a><a href="#top">5</a>`;
		expect(rewriteBaseInHtml(html, "/app")).toBe(html);
	});

	test("normalizes single-quoted attributes to double quotes", () => {
		expect(rewriteBaseInHtml(`<a href='/about'>x</a>`, "/app")).toContain('href="/app/about"');
	});

	test("returns html unchanged without a base", () => {
		const html = `<a href="/about">x</a>`;
		expect(rewriteBaseInHtml(html, "")).toBe(html);
	});

	test("getBasePath/setBasePath round-trips through the module state", () => {
		expect(getBasePath()).toBe("");
		setBasePath("/app");
		expect(getBasePath()).toBe("/app");
		setBasePath(undefined);
		expect(getBasePath()).toBe("");
	});
});
