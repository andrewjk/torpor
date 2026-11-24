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

test("server text inside raw-text elements is not escaped", async () => {
	const source = `
export default function Component() {
	let code = 'if (a < b && c) alert("&lt;");';
	@render {
		<div>
			<script>{code}</script>
			<style>{code}</style>
			<p>{code}</p>
		</div>
	}
}`;

	const html = await buildHtml(source);

	// `<script>` / `<style>` are raw-text elements: the browser doesn't decode
	// character references inside them, so the value must arrive unescaped
	expect(html).toContain(`<script>if (a < b && c) alert("&lt;");</script>`);
	expect(html).toContain(`<style>if (a < b && c) alert("&lt;");</style>`);
	// ...unlike ordinary text, which stays escaped
	expect(html).toContain(`<p>if (a &lt; b &amp;&amp; c) alert("&amp;lt;");</p>`);
});
