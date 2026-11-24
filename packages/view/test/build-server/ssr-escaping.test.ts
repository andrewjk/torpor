import { expect, test } from "vite-plus/test";
import buildHtml from "../buildHtml";

// These tests go through the full server build with the real escaping
// helpers (see `buildHtml`), so they catch escaping regressions end to end.

test("server text and attribute values are escaped", async () => {
	const source = `
export default function Component() {
	let value = '<b> & "quoted"';
	@render {
		<p title={value}>{value}</p>
	}
}`;

	const html = await buildHtml(source);

	expect(html).toBe('<p title="<b> &amp; &quot;quoted&quot;">&lt;b&gt; &amp; "quoted"</p>');
});

test("server raw-text element contents are emitted literally", async () => {
	const source = `
export default function Component() {
	let value = '<b> & "quoted"';
	@render {
		<div>
			<script>const a = { b: 1 }; if (a < b) alert("&lt;");</script>
			<style>@media (min-width: 1px) { p { color: red } }</style>
			<p>{value}</p>
		</div>
	}
}`;

	const html = await buildHtml(source);

	// `<script>` / `<style>` are raw-text elements: they are not parsed as
	// templates, and the browser doesn't decode character references inside
	// them, so both braces and entities arrive literally
	expect(html).toContain(`<script>const a = { b: 1 }; if (a < b) alert("&lt;");</script>`);
	expect(html).toContain(`<style>@media (min-width: 1px) { p { color: red } }</style>`);
	// ...unlike ordinary text, which stays interpolated and escaped
	expect(html).toContain(`<p>&lt;b&gt; &amp; "quoted"</p>`);
});
