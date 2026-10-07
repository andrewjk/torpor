# torpor/unplugin

An [unplugin](https://github.com/unjs/unplugin) package to compile Torpor components for Vite, Rollup, and other bundlers.

## Testing

The `test: true` option compiles `.torp` components for the server by default, so tests can call them as functions and assert on the rendered `{ body, head }` (and `runTest` can render a whole site). Import a component with a `?client` query to compile (and mount) it client-side in the same project.

Server-rendering tests that import a `.torp` directly should instead run in a **Vite SSR environment**. Vite's ssr flag compiles server-side, and is what makes the plugin resolve `@torpor/view` to its server runtime (`@torpor/view/ssr`) for shared `.ts`/`.js` modules — without it, a helper like `@torpor/ui`'s `createItemGroup` keeps the client `$cache` and throws `$cache must be used in a getter` during SSR. Server-compiled `.torp` files already import `@torpor/view/ssr` directly; the ssr flag covers the plain modules the compiler doesn't touch.

In Vitest the built-in `jsdom` and `happy-dom` environments are `viteEnvironment: "client"`, so `test: true` alone does **not** trigger that resolution. Use a separate test project with a DOM-shimmed SSR environment, and name server-rendering tests `*-ssr.test.ts` so the two projects' globs don't overlap:

```ts
// test/ssr-dom-env.ts
import { builtinEnvironments } from "vitest/runtime";

export default {
	...builtinEnvironments["happy-dom"], // or "jsdom"
	name: "ssr-dom",
	viteEnvironment: "ssr",
};
```

```ts
// vitest.config.ts
export default defineConfig({
	test: {
		projects: [
			{
				plugins: [torpor({ test: true })],
				test: {
					name: "ssr",
					environment: "./test/ssr-dom-env.ts",
					include: ["test/**/*-ssr.test.ts"],
				},
			},
			{
				plugins: [torpor()],
				test: {
					name: "client",
					environment: "jsdom",
					exclude: ["test/**/*-ssr.test.ts"],
				},
			},
		],
	},
});
```

The two must be separate projects: a `viteEnvironment: "ssr"` project resolves `@torpor/view` to the server runtime for _everything_, so `mount`/`hydrate` hit the server stubs that throw. Keep client mounting in a `client` project. (The `node` environment is already `viteEnvironment: "ssr"` if the SSR tests don't need a DOM.)

The same setup is exercised in this repo's `packages/unplugin/test` and `packages/ui/test` (see their `vitest.config.ts` / `ssr-dom-env.ts`).
