import torpor from "@torpor/unplugin/vite";
import { type ViteUserConfigFnObject, defineConfig } from "vite-plus";

// Tests named `*-ssr.test.ts` run in the DOM-shimmed SSR environment (see
// test/ssr-dom-env.ts) so the unplugin resolves `@torpor/view` to its server
// runtime for shared `.ts`/`.js` helpers. Mounting tests stay on jsdom -- the
// two must be separate projects, because a `viteEnvironment: "ssr"` project
// resolves `mount`/`hydrate` to the server stubs that throw.
const ssrTests = ["test/**/*-ssr.test.ts"];

export default defineConfig(({ mode }) => {
	const resolve = { conditions: mode === "test" ? ["browser"] : [] };
	return {
		test: {
			projects: [
				{
					plugins: [torpor()],
					resolve,
					test: {
						name: "ssr",
						environment: "./test/ssr-dom-env.ts",
						include: ssrTests,
					},
				},
				{
					plugins: [torpor()],
					resolve,
					test: {
						name: "client",
						environment: "jsdom",
						include: ["test/**/*.test.ts"],
						exclude: ssrTests,
					},
				},
			],
		},
	};
}) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
