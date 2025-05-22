import { expect, test } from "vitest";
import buildHtml from "../buildHtml";

test("build server element node", () => {
	const source = `
export default function Component() {
	@render {
		<p></p>
	}
}`;

	const html = buildHtml(source);

	expect(html).toBe("<p></p>");
});

test("build server element node with attributes", () => {
	const source = `
export default function Component() {
	@render {
		<p class="big"></p>
	}
}`;

	const html = buildHtml(source);

	expect(html).toBe(`<p class="big"></p>`);
});

test("build server element node with quoted attributes", () => {
	const source = `
export default function Component() {
	let value = 'some "text"'
	@render {
		<p>
			<input value='some "text"'>
			<input value={value}>
			<input &value={value}>
			<input {value}>
			<input value={value + " extra"}>
			<input value="{value} extra">
		</p>
	}
}`;

	const html = buildHtml(source);
	const expected = `
<p>
<input value="some &quot;text&quot;">
<input value="some &quot;text&quot;">
<input value="some &quot;text&quot;">
<input value="some &quot;text&quot;">
<input value="some &quot;text&quot; extra">
<input value="some &quot;text&quot; extra">
</p>
`
		.trim()
		.replace(/\s+/g, " ");

	expect(html).toBe(expected);
});
