import { builtinEnvironments } from "vite-plus/test/runtime";

/**
 * A DOM-shimmed SSR environment: happy-dom provides the browser globals some
 * server-rendered code touches, while `viteEnvironment: "ssr"` makes Vite
 * process this project's modules as SSR. That's what lets the unplugin resolve
 * `@torpor/view` to its server runtime for shared `.ts`/`.js` modules (the
 * `resolveId` rewrite keys on Vite's ssr flag), which a plain jsdom project
 * (`viteEnvironment: "client"`) can't do.
 *
 * Client mounting must live in a separate project: with `viteEnvironment:
 * "ssr"`, `mount`/`hydrate` resolve to the server stubs that throw.
 */
export default {
	...builtinEnvironments["happy-dom"],
	name: "ssr-dom",
	viteEnvironment: "ssr",
};
