# torpor/adapter-electron

A @torpor/build adapter for building desktop apps with [Electron](https://www.electronjs.org/).

🚧 WARNING: WORK IN PROGRESS 🚧

## Installation

Install the adapter and Electron using `npm` (or your preferred package manager):

```bash
npm install @torpor/adapter-electron
npm install -D electron
```

Then use the adapter in your `site.config`:

```javascript
import { electron } from "@torpor/adapter-electron";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = electron();
```

## Commands

- `tb --dev` builds the site and opens an Electron window against the Vite dev
  server, with HMR. The dev server is still available in the browser.
- `tb --build` writes the desktop app to `dist/electron`.
- `tb --preview` builds and launches the built app.

## How it works

The generated app runs the site's server **in the Electron main process** on
Node, and serves it over a loopback HTTP server (`127.0.0.1`), which the
`BrowserWindow` loads. Because requests are real HTTP requests, cookies,
sessions, `flash` messages and redirects behave exactly as they do with
`@torpor/adapter-node` -- and Chromium's session cookie store persists them for
you across launches (see **Sessions** below).

`dist/electron` contains:

- `main.mjs` -- the Electron main process (starts the server, opens the window)
- `preload.cjs` -- a context-isolated preload
- `electron.json` -- the adapter options (host, port, partition, window)
- `package.json` -- a minimal Electron app manifest

## Sessions and auth

The adapter uses a persistent session partition (`persist:torpor` by default),
so Torpor's signed session cookie survives restarts with no extra work.
Cookies are scoped to the host, not the port, so this holds even though the
default port is ephemeral.

For a "remember me" token that outlives the session, use Electron's
[`safeStorage`](https://www.electronjs.org/docs/latest/api/safe-storage) to
encrypt it with the OS keychain (macOS Keychain, Windows DPAPI, Linux Secret
Service) and write it under `app.getPath("userData")`. Never store passwords or
tokens in `localStorage` or the renderer.

## Options

```javascript
site.adapter = electron({
	partition: "persist:torpor", // session partition (cookies/web storage)
	host: "127.0.0.1", // loopback host for the server
	port: 0, // 0 = ephemeral; pin a port to keep web storage stable
	window: { width: 1280, height: 800, title: "Flub" },
	dev: true, // set false to skip the desktop window in dev
});
```

Cookies persist across launches regardless of the port. Web storage
(`localStorage`, `IndexedDB`) is origin-scoped, so pin `port` if the app relies
on it staying put.

## Packaging

The emitted `dist/electron` app is a normal Electron app; package it with
[electron-builder](https://www.electron.build/) or
[Electron Forge](https://forge.electron.build/) by pointing the app directory at
`dist/electron`. Include the site's `node_modules` (or add the emitted app's
runtime dependencies to the builder config) so `@torpor/adapter-electron` and
`@torpor/build` resolve. With pnpm, a hoisted `node-linker` is easiest.
