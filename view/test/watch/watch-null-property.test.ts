import { $watch } from "@tera/view";
import { expect, test } from "vitest";

test("watching a null property", () => {
	const input = {
		name: null,
	};
	const output = $watch(input);
	expect(output.name).toBe(null);
});
