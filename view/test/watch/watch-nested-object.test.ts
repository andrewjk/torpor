import { $watch } from "@tera/view";
import { expect, test } from "vitest";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("watching a nested object", () => {
	const input = {
		person: {
			name: "Andrew",
		},
	};
	const output = $watch(input);
	expect(output[proxyDataSymbol]).not.toBeNull();
	expect(output.person[proxyDataSymbol]).not.toBeNull();
});
