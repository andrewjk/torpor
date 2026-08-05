# Follow-ups

Items that were noticed and deliberately left out of scope of a previous change.
Each entry should describe what was seen, where, and any relevant context.

## packages/build

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
