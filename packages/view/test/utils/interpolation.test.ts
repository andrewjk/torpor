import { expect, test } from "vite-plus/test";
import isFullyReactive from "../../src/compile/utils/isFullyReactive";
import isReactive from "../../src/compile/utils/isReactive";
import createText from "../../src/render/createText";

test("isReactive finds complete interpolations", () => {
	expect(isReactive("Hello {name}")).toBe(true);
	expect(isReactive("Hello {{ name: 'Torpor' }}")).toBe(true);
	expect(isReactive("{foo} and {bar}")).toBe(true);
});

test("isReactive ignores braces in strings and comments", () => {
	expect(isReactive(`{foo("}")}`)).toBe(true);
	expect(isReactive("{foo /* } */}")).toBe(true);
	expect(isReactive("{foo // }\n}")).toBe(true);
	expect(isReactive("{/}/.test(value)}")).toBe(true);
});

test("isReactive requires a matching close brace", () => {
	expect(isReactive("Hello } and {")).toBe(false);
	expect(isReactive("Hello {unclosed")).toBe(false);
	expect(isReactive("Just text")).toBe(false);
});

test("isFullyReactive only accepts a single interpolation", () => {
	expect(isFullyReactive("{name}")).toBe(true);
	expect(isFullyReactive("  { name }  ")).toBe(true);
	expect(isFullyReactive(`{foo("}")}`)).toBe(true);
	expect(isFullyReactive("{foo /* } */}")).toBe(true);
	expect(isFullyReactive("{foo} extra")).toBe(false);
	expect(isFullyReactive("{foo} /* } */")).toBe(false);
	expect(isFullyReactive('"{foo}"')).toBe(false);
});

test("createText uses the same interpolation detection", () => {
	expect(createText("Hello").textContent).toBe("Hello");
	expect(createText("Hello } and {").textContent).toBe("Hello } and {");
	expect(createText("Hello {name}").textContent).toBe(" ");
	expect(createText(`{foo("}")}`).textContent).toBe(" ");
});
