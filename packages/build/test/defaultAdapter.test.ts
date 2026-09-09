import { expect, test } from "vite-plus/test";
import { resolveAdapter } from "../src/site/defaultAdapter";
import Site from "../src/site/Site";
import defaultAdapter from "../src/site/defaultAdapter";
import type Adapter from "../src/types/Adapter";

const NODE_PKG = "@torpor/adapter-node";
const CLOUDFLARE_PKG = "@torpor/adapter-cloudflare";

function fakeAdapter(): Adapter {
	return { serve: () => {} };
}

/**
 * A loader that only knows about installed adapters, by package name.
 */
function loader(installed: string[]) {
	return async (pkg: string) => (installed.includes(pkg) ? fakeAdapter() : undefined);
}

test("a platform marker selects the platform's adapter when installed", async () => {
	const res = await resolveAdapter({
		env: { CF_PAGES: "1" },
		load: loader([NODE_PKG, CLOUDFLARE_PKG]),
	});

	expect(res.pkg).toBe(CLOUDFLARE_PKG);
	expect(res.reason).toBe("CF_PAGES detected");
	expect(res.adapter).toBeDefined();
});

test("a platform marker is ignored when that adapter isn't installed", async () => {
	const res = await resolveAdapter({ env: { CF_PAGES: "1" }, load: loader([NODE_PKG]) });

	expect(res.pkg).toBe(NODE_PKG);
	expect(res.reason).toBe("installed");
});

test("an installed adapter is used when no platform is detected, preferring node", async () => {
	const res = await resolveAdapter({ env: {}, load: loader([NODE_PKG, CLOUDFLARE_PKG]) });

	expect(res.pkg).toBe(NODE_PKG);
	expect(res.reason).toBe("installed");
});

test("a non-node adapter is used when it's the only one installed", async () => {
	const res = await resolveAdapter({ env: {}, load: loader([CLOUDFLARE_PKG]) });

	expect(res.pkg).toBe(CLOUDFLARE_PKG);
});

test("no installed adapters resolves to undefined", async () => {
	const res = await resolveAdapter({ env: {}, load: async () => undefined });

	expect(res.adapter).toBeUndefined();
	expect(res.pkg).toBeUndefined();
});

test("the default adapter serves on the current runtime as a last resort", async () => {
	const served: any[] = [];
	(globalThis as any).Bun = {
		serve: (options: any) => served.push(options),
	};

	try {
		const server = { fetch: async () => new Response("ok") };
		// The resolution runs against the real environment, where no adapter
		// package is installed relative to @torpor/build
		await defaultAdapter.serve(server as any, new Site() as any);

		expect(served).toHaveLength(1);
		expect(served[0].hostname).toBe("localhost");
		// The served fetch handler delegates to the server's
		expect(await served[0].fetch(new Request("http://localhost/"))).toBeInstanceOf(Response);
	} finally {
		delete (globalThis as any).Bun;
	}
});
