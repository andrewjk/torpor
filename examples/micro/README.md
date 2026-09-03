# torpor/examples-micro

A micro demo site built with [torpor/build](../../packages/build).

This shows the absolute bare minimum required for a torpor/build site:

- add a component in the src folder
- edit site.config.ts to add the route to the component

TODO: When you need more functionality, you can migrate this to a minimal site with a router, layouts and more.

## Running

Clone Torpor and use [pnpm](https://pnpm.io) (this is a pnpm workspace) to
install dependencies and build the packages, then run the demo:

```bash
git clone https://github.com/andrewjk/torpor.git
cd torpor
pnpm install
pnpm build
cd examples/micro
pnpm run dev
```
