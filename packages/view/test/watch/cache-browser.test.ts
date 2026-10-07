import { expect, test } from "vite-plus/test";
import $cache from "../../src/watch/$cache";

test("$cache throws when read outside a getter in the browser", () => {
	// No SSR runtime loaded and jsdom's `window` exists, so this is the client:
	// reading a cache outside a getter is a mistake worth reporting
	expect(() => $cache(() => 1)).toThrow("$cache must be used in a getter");
});
