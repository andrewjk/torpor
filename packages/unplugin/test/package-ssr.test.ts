import { expect, test } from "vite-plus/test";
import { Progress } from "@torpor/ui/Progress";
import { Widget } from "torp-lib/Widget";

// Without a query, components from packages that ship .torp files must still
// be SSR-compiled in a test project (test: true), so they can be called as
// functions and asserted on via result.body -- package detection must not
// leak an override onto plain imports
const ssrWidget = Widget as unknown as (
	props?: Record<string, any>,
) => Promise<{ body: string; head: string }>;
const ssrProgress = Progress as unknown as (
	props?: Record<string, any>,
) => Promise<{ body: string; head: string }>;

test("ssr markup -- package components render to body html by default", async () => {
	const widget = await ssrWidget({ label: "Server" });
	expect(widget.body).toContain("Server: 0");

	const progress = await ssrProgress({ value: 7 });
	expect(progress.body).toContain('aria-valuenow="7"');
});
