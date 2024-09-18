import { $watch } from "@tera/view";
import { expect, test } from "vitest";
import { proxyDataSymbol } from "../../src/watch/symbols";

test("watching a simple object", () => {
	const input = {
		name: "Andrew",
	};
	const output = $watch(input);
	expect(output[proxyDataSymbol]).not.toBeNull();
});
