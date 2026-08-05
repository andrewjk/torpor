import { describe, expect, test } from "vite-plus/test";
import prepareTemplate from "../src/run/prepareTemplate";

function baseTemplate(content = ""): string {
	return `<!doctype html>
<html>
<head>
<title>Site</title>
</head>
<body>
<div id="app">${content}</div>
</body>
</html>`;
}

describe("prepareTemplate", () => {
	test("inserts %COMPONENT_HEAD% before </head>", () => {
		const out = prepareTemplate(baseTemplate(), "/client.js");
		expect(out).toContain("%COMPONENT_HEAD%</head>");
	});

	test('inserts %COMPONENT_BODY% inside <div id="app"></div>', () => {
		const out = prepareTemplate(baseTemplate(), "/client.js");
		expect(out).toContain('<div id="app">%COMPONENT_BODY%</div>');
	});

	test("appends a single client script when no dev script is given", () => {
		const out = prepareTemplate(baseTemplate(), "/client.js");
		const matches = out.match(/<script[^>]*src="\/client\.js"[^>]*>/g);
		expect(matches).toHaveLength(1);
		expect(out).toMatch(/<script type="module" src="\/client\.js"><\/script>$/);
	});

	test("prepends the dev script when given", () => {
		const out = prepareTemplate(baseTemplate(), "/client.js", "/dev.js");
		expect(out).toMatch(
			/<script type="module" src="\/dev\.js"><\/script><script type="module" src="\/client\.js"><\/script>$/,
		);
	});

	test("supports single-quoted id attribute", () => {
		const tpl = baseTemplate().replace('id="app"', "id='app'");
		const out = prepareTemplate(tpl, "/client.js");
		expect(out).toContain("%COMPONENT_BODY%");
	});

	test("throws when there is no </head>", () => {
		expect(() =>
			prepareTemplate('<html><body><div id="app"></div></body></html>', "/c.js"),
		).toThrow(/Couldn't find <head> end tag/);
	});

	test('throws when there is no <div id="app"></div>', () => {
		const tpl = `<!doctype html><html><head></head><body><p>no app div</p></body></html>`;
		expect(() => prepareTemplate(tpl, "/c.js")).toThrow(/Couldn't find <div id="app"><\/div>/);
	});

	test("preserves the rest of the template", () => {
		const out = prepareTemplate(baseTemplate(), "/client.js");
		expect(out).toContain("<title>Site</title>");
	});
});
