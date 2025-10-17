import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("watching a nested object", () => {
	const input = {
		person: {
			name: "Andrew",
		},
	};
	const output = $watch(input);
	// @ts-ignore
	expect(output[proxyDataSymbol]).not.toBeNull();
	// @ts-ignore
	expect(output.person[proxyDataSymbol]).not.toBeNull();
});
