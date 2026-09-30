/**
 * Dev-only entry point for adapters that keep the framework's default Node
 * runtime but want to add their own sidecar -- e.g. a desktop shell that opens
 * a window alongside the Vite dev server.
 *
 * `Adapter.dev` replaces the framework's default Node dev plugin, so an
 * adapter that doesn't need a different runtime (unlike the Cloudflare
 * adapter, which uses workerd) can compose this with its own plugin(s) instead
 * of reimplementing Node SSR dev:
 *
 * ```ts
 * import { nodeDev } from "@torpor/build/node-dev";
 *
 * export default {
 *   dev: (site) => [nodeDev(site), myLauncher(site)],
 * } satisfies Adapter;
 * ```
 *
 * Exported as `@torpor/build/node-dev`: registry installs get the compiled
 * `dist/nodeDev.mjs`, while linked (source-mode) installs resolve the
 * `torpor:source` condition to this file. Not intended for production use.
 */
export { default as nodeDev } from "./run/devPlugin.ts";
