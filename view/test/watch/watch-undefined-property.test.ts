import { $watch } from "@tera/view";
import { expect, test } from "vitest";

test("watching an undefined property", () => {
	const input = {};
	const output = $watch(input);
	// @ts-ignore
	expect(output.name).toBe(undefined);
});
