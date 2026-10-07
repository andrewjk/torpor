import { expect, test } from "vite-plus/test";
import Counter from "./components/Counter.torp";

// Plain .torp imports are SSR-compiled in a test project (test: true), so a
// component can be called as a function and asserted on via result.body
const ssr = Counter as unknown as (
	props?: Record<string, any>,
) => Promise<{ body: string; head: string }>;

test("ssr markup -- component renders to body html", async () => {
	const result = await ssr({ start: 5 });

	expect(result.body).toContain("Count: 5");
	expect(result.body).toContain("<button");
});

test("ssr markup -- props render into body html", async () => {
	const result = await ssr({ start: 1 });

	expect(result.body).toContain("Count: 1");
});
