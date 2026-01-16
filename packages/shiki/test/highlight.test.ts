import { expect, test } from "vitest";
import { codeToHtml } from "../src/index";

test("basic highlight", async () => {
	const code = `
export default function Test() {
}
`.trimEnd();
	const expected = html(`
${line(`${span("export", "#AF00DB")}${span(" default", "#AF00DB")}${span(" function", "#0000FF")}${span(" Test", "#795E26")}${span("() {")}`)}
${line(`${span("}")}`)}
`).trim();
	const result = await codeToHtml(code, { lang: "torpor", theme: "light-plus" });
	expect(result).toBe(expected);
});

function html(inner: string) {
	return `
<pre class="shiki light-plus" style="background-color:#FFFFFF;color:#000000" tabindex="0"><code><span class="line"></span>
${inner.trim()}</code></pre>
`;
}

function line(inner: string) {
	return `<span class="line">${inner}</span>`;
}

function span(inner: string, color = "#000000") {
	return `<span style="color:${color}">${inner}</span>`;
}
