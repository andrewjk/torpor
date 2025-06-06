import { expect, test } from "vitest";
import $watch from "../../src/render/$watch";

test("watching a null object", () => {
	const input = null;
	// @ts-ignore
	const output = $watch(input);
	expect(output).toBe(null);
});
