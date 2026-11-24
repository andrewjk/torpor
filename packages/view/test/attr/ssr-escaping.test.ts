import { expect, test } from "vite-plus/test";
import build from "../../src/compile/build";
import parse from "../../src/compile/parse";
import buildServerAttribute from "../../src/ssr/buildAttribute";
import buildServerClasses from "../../src/ssr/buildClasses";
import buildServerStyles from "../../src/ssr/buildStyles";

const attack = '" onmouseover="alert(1)';

test("server classes can't break out of the class attribute", () => {
	expect(buildServerClasses(`a${attack}`)).toBe('class="a&quot; onmouseover=&quot;alert(1)"');
	expect(buildServerClasses({ [`b${attack}`]: true })).toBe(
		'class="b&quot; onmouseover=&quot;alert(1)"',
	);
});

test("server styles can't break out of the style attribute", () => {
	expect(buildServerStyles(`color: red${attack}`)).toBe(
		'style="color: red&quot; onmouseover=&quot;alert(1)"',
	);
	expect(buildServerStyles({ color: `red${attack}` })).toBe(
		'style="color: red&quot; onmouseover=&quot;alert(1)"',
	);
});

test("server classes and styles still omit empty attributes", () => {
	expect(buildServerClasses("")).toBe("");
	expect(buildServerStyles({})).toBe("");
});

test("server attributes escape quotes and ampersands", () => {
	expect(buildServerAttribute("title", `a & b${attack}`)).toBe(
		'title="a &amp; b&quot; onmouseover=&quot;alert(1)"',
	);
});

test("bound values on number and checkbox inputs are escaped on the server", () => {
	for (const type of ["number", "checkbox", "text"]) {
		const source = `
export default function Bound($props: any) {
	@render {
		<input type="${type}" &value={$props.value} />
	}
}
`;
		const parsed = parse(source);
		expect(parsed.errors).toEqual([]);
		const server = build(parsed.template!, { server: true });
		expect(server.code).toContain("t_attr($props.value)");
	}
});
