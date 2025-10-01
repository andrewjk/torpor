import { assert, expect, test } from "vitest";
import parse from "../../src/compile/parse";
import { trimParsed } from "../helpers";

test("empty file", () => {
	const input = "";
	const output = trimParsed(parse(input));
	expect(output.ok).toBe(true);
	expect(output.errors).toEqual([]);
	assert(output.template);
	expect(output.template.imports).toEqual([]);
	expect(output.template.script.map((s) => s.script).join("")).toBe("");
	expect(output.template.components.length).toBe(0);
});
