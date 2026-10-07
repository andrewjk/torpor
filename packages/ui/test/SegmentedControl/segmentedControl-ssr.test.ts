import { expect, test } from "vite-plus/test";
import SegmentedControlTest from "./components/SegmentedControlTest.torp";

// Server-rendering a component that uses `createItemGroup` (a plain `.ts`
// helper importing `@torpor/view`) only works when the SSR test project
// resolves `@torpor/view` to its server runtime -- otherwise the helper's
// `$cache` throws "must be used in a getter" during SSR (see ssr-dom-env.ts)
const ssr = SegmentedControlTest as unknown as (
	props?: Record<string, any>,
) => Promise<{ body: string; head: string }>;

test("SSR renders a SegmentedControl through the server runtime", async () => {
	const { body } = await ssr({});

	expect(body).toContain("torp-segmented-control");
	expect(body).toContain('aria-checked="true"');
	expect(body).toContain('data-state="active"');
});
