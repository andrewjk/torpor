import { describe, expect, test } from "vite-plus/test";
import mergeHead from "../src/site/mergeHead";

const template = `<html><head><title>Fallback</title></head><body><div id="app">%COMPONENT_BODY%</div>%COMPONENT_HEAD%</body></html>`;

describe("mergeHead", () => {
	test("page title overrides the template title", () => {
		const html = mergeHead(template, `<title>Page</title>`);
		expect(html.match(/<title[^>]*>.*?<\/title>/g)).toEqual(["<title>Page</title>"]);
	});

	test("the first (most specific) title wins", () => {
		const html = mergeHead(template, `<title>Page</title><style>x{}</style><title>Child</title>`);
		expect(html.match(/<title[^>]*>.*?<\/title>/g)).toEqual(["<title>Page</title>"]);
		expect(html).toContain("<style>x{}</style>");
	});

	test("other head content is preserved when there is a title", () => {
		const html = mergeHead(
			template,
			`<style>a{}</style><title>Page</title><meta name="description" content="Test">`,
		);
		expect(html).toContain("<style>a{}</style>");
		expect(html).toContain(`<meta name="description" content="Test">`);
		expect(html.match(/<title[^>]*>.*?<\/title>/g)).toEqual(["<title>Page</title>"]);
	});

	test("template title is kept when there is no component title", () => {
		const html = mergeHead(template, `<style>a{}</style><meta name="description" content="Test">`);
		expect(html).toContain("<title>Fallback</title>");
		expect(html).toContain("<style>a{}</style>");
	});

	test("template without a title is untouched", () => {
		const noTitle = `<html><head></head><body><div id="app">%COMPONENT_BODY%</div>%COMPONENT_HEAD%</body></html>`;
		const html = mergeHead(noTitle, `<style>a{}</style>`);
		expect(html).not.toContain("<title>");
		expect(html).toContain("<style>a{}</style>");
	});
});
