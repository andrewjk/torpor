# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## packages/build

### Manifest plugin reads route files from disk to detect `load:`

`src/site/manifest.ts:70` does `readFileSync(path.join(site.root, r.file)).includes("load:")`
on the **client** build to decide whether a `+page.server.ts` exports a `load`
function (so a stub can be emitted in the manifest). This is fragile: any
occurrence of the literal `load:` in comments or unrelated code triggers the
stub, and a different export style (`export const load =`) does not.

A cleaner approach would be to parse the module's exports (via vite's own
SSR module loading during dev / via rollup's module info during build), but
that's a bigger refactor than the current task.

### `tsconfig.json` skips lib check

`packages/build/tsconfig.json` has `"skipLibCheck": true` with a TODO comment
("We should be using the tsconfig from the site"). Means cross-package type
drift won't be caught at typecheck time. Left alone because it predates this
task.

### Dead/duplicated code paths elsewhere

- `src/site/Site.ts:33-35` — design TODOs about whether `defaultAdapter` and
  default plugins are a good idea. Not a HACK to remove; flagged for the
  framework's design discussion.
- `scripts/postbuild.ts` — renames `bin/index.mjs` → `bin/index.js` after
  packaging. This is a tsdown packaging HACK that should be configured in
  `vite.config.ts` `pack.entry` instead. Out of scope here.
