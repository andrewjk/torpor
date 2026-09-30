# torpor/examples-electron

An Electron desktop app built with [torpor/build](../../packages/build) and
[torpor/adapter-electron](../../packages/adapters/adapter-electron).

It's a minimal but complete desktop app: a server-rendered page wrapped in a
layout, an error page, and a `/api/info` endpoint whose code runs in the
Electron main process (Node), which the page fetches on mount to show that
requests really go through Node.

## Running

Clone Torpor and use [pnpm](https://pnpm.io) (this is a pnpm workspace) to
install dependencies and build the packages:

```bash
git clone https://github.com/andrewjk/torpor.git
cd torpor
pnpm install
pnpm build
cd examples/electron
```

Electron is deliberately **not** a dependency of the workspace (it's a large,
per-platform download), so install it once to open a desktop window:

```bash
pnpm add -D electron
pnpm run dev
```

`pnpm run dev` starts the dev server and opens an Electron window pointed at
it, with HMR. The app is also available in the browser at
http://localhost:7059 (the adapter only warns if Electron isn't installed).

`pnpm run build` writes the desktop app to `dist/electron`, and
`pnpm run preview` builds and launches it.
