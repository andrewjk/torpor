import { expect, test } from "vite-plus/test";
import { $cache } from "@torpor/view";

// In an SSR test project (viteEnvironment "ssr") the unplugin resolves
// `@torpor/view` to `@torpor/view/ssr`, so `$cache` is the server version:
// it evaluates its function rather than requiring a getter (and would throw
// "must be used in a getter" if it were the client entry)
test("SSR test projects resolve @torpor/view to the server runtime", () => {
	expect($cache(() => 42)).toBe(42);
});
