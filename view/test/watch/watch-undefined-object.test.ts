import { $watch } from "@tera/view";
import { expect, test } from "vitest";

test("watching an undefined object", () => {
	const input = undefined;
	// @ts-ignore
	const output = $watch(input);
	expect(output).toBe(undefined);
});
