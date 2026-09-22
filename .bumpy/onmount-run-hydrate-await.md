---
"@torpor/view": patch
---

Fix: add missing `await` on `hydrateComponent` in the on-mount `$run` test

`test/on-mount/mount-with-run.ts` called `hydrateComponent(...)` without
`await`, so the hydration assertions could run before the SSR HTML was
guaranteed to be in the container. Also renamed the file to
`mount-with-run.test.ts` -- it had been added without the `.test.ts`
suffix, so vitest's include pattern never picked it up and neither test
in it was actually running. Both tests pass with the `await` and the
rename in place.
