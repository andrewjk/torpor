import { describe, expect, test } from "vite-plus/test";
import seo from "../src/seo";
import { sitemapXml } from "../src/run/runPrerender";
import { normalizeBasePath, normalizeOrigin } from "../src/site/basePath";
import type { HeadElement } from "../src/types/PageEndPoint";

describe("seo", () => {
	test("builds title and description elements", () => {
		const head = seo({
			title: "My post — the <best> one",
			description: "About the post",
		});
		expect(head).toEqual([
			{ title: "My post — the <best> one" } satisfies HeadElement,
			{ property: "og:title", content: "My post — the <best> one" },
			{ name: "description", content: "About the post" },
			{ property: "og:description", content: "About the post" },
		]);
	});

	test("includes og:url and twitter card elements when an image is set", () => {
		const head = seo({
			title: "My post",
			image: "https://example.com/cover.jpg",
			url: "https://example.com/posts/1",
		});
		expect(head).toEqual([
			{ title: "My post" },
			{ property: "og:title", content: "My post" },
			{ property: "og:image", content: "https://example.com/cover.jpg" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:image", content: "https://example.com/cover.jpg" },
			{ property: "og:url", content: "https://example.com/posts/1" },
		]);
	});

	test("returns nothing empty", () => {
		expect(seo({})).toEqual([]);
	});
});

describe("sitemapXml", () => {
	test("builds one url per rendered page", () => {
		const xml = sitemapXml("https://example.com", "", ["/", "/about", "/posts/1"]);
		expect(xml).toContain(`<loc>https://example.com/</loc>`);
		expect(xml).toContain(`<loc>https://example.com/about</loc>`);
		expect(xml).toContain(`<loc>https://example.com/posts/1</loc>`);
		expect(xml).toContain(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);
		expect(xml.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`)).toBe(true);
	});

	test("escapes xml entities and roots", () => {
		const xml = sitemapXml("https://x.com", "", ["/a&b<c>"]);
		expect(xml).toContain(`<loc>https://x.com/a&amp;b&lt;c&gt;</loc>`);
	});

	test("mounts under base paths", () => {
		const xml = sitemapXml("https://x.com", "/app", ["/", "/about"]);
		expect(xml).toContain(`<loc>https://x.com/app</loc>`);
		expect(xml).toContain(`<loc>https://x.com/app/about</loc>`);
	});
});

describe("normalizeOrigin", () => {
	test("accepts absolute origins and strips trailing slashes", () => {
		expect(normalizeOrigin("https://example.com")).toBe("https://example.com");
		expect(normalizeOrigin("https://example.com/")).toBe("https://example.com");
		expect(normalizeOrigin("http://localhost:7059")).toBe("http://localhost:7059");
	});

	test("rejects paths in origins and spaces", () => {
		for (const value of ["example.com", "https://example.com/path", "https://x.com/a b"]) {
			expect(() => normalizeOrigin(value)).toThrow(/site origin/);
		}
	});

	test("normalizeBasePath edge cases still hold", () => {
		expect(normalizeBasePath("/app/")).toBe("/app");
		expect(() => normalizeBasePath("app")).toThrow();
	});
});
