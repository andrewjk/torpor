/**
 * Dev-only entry point re-exporting the server-side pieces that adapters need
 * to assemble a dev runtime (e.g. the Cloudflare adapter's workerd dev worker).
 *
 * Exported as `@torpor/build/dev`: registry installs get the compiled
 * `dist/dev.mjs`, while linked (source-mode) installs resolve the
 * `development` condition to this file, so Vite transforms and HMR apply.
 * Not intended for production use — production workers are bundled from the
 * built output instead.
 */
export { default as Server } from "./server/Server.ts";
export { load } from "./site/serverEntry.ts";
