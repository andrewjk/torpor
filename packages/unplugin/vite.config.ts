import { defineConfig, UserConfig } from "vite-plus";
import torpor from "./src/vite";

// Tests named `*-ssr.test.ts` run in the DOM-shimmed SSR environment (see
// test/ssr-dom-env.ts) so the unplugin resolves `@torpor/view` to
// `@torpor/view/ssr` for shared modules. Everything else mounts client-side
// and stays on jsdom -- the two must be separate projects, because a
// `viteEnvironment: "ssr"` project resolves `mount`/`hydrate` to the server
// stubs that throw.
const ssrTests = ["test/**/*-ssr.test.ts"];

export default defineConfig({
	pack: {
		entry: ["src/*.ts"],
	},
	test: {
		projects: [
			{
				plugins: [torpor()],
				test: {
					name: "ssr",
					environment: "./test/ssr-dom-env.ts",
					include: ssrTests,
				},
			},
			{
				plugins: [torpor()],
				test: {
					name: "client",
					environment: "jsdom",
					include: ["test/*.test.ts"],
					exclude: ssrTests,
				},
			},
		],
	},
}) satisfies UserConfig as UserConfig;
