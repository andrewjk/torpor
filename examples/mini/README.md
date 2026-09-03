# torpor/examples-mini

A mini demo site built with [torpor/build](../../packages/build).

This shows a minimal but still full-featured torpor/build site:

- add Layout and Error components in the src folder
- add a component in the src folder
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
cd examples/mini
pnpm run dev
```
