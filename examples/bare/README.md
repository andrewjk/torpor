# torpor/examples-bare

A bare demo site built with [torpor/build](../../packages/build).

This shows a bare torpor/build site that just has an endpoint (no components):

- add a routes.ts file that sets up routing
- edit site.config.ts to load routes

TODO: When your site gets more complicated, you can migrate this to a site with folder/file based routing and more.

## Running

Clone Torpor and use [pnpm](https://pnpm.io) (this is a pnpm workspace) to
install dependencies and build the packages, then run the demo:

```bash
git clone https://github.com/andrewjk/torpor.git
cd torpor
pnpm install
pnpm build
cd examples/bare
pnpm run dev
```
