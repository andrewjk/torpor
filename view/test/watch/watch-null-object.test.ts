import { $watch } from "@tera/view";
import { expect, test } from "vitest";

test("watching a null object", () => {
	const input = null;
	// @ts-ignore
	const output = $watch(input);
	expect(output).toBe(null);
});
