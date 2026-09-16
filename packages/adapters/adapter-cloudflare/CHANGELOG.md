# @torpor/adapter-cloudflare

## 1.0.7

<sub>2026-09-16</sub>

- _(patch)_ Updated dependency `@torpor/build` v1.4.1

## 1.0.6

<sub>2026-09-16</sub>

- _(patch)_ Updated dependency `@torpor/build` v1.4.0

## 1.0.5

<sub>2026-09-14</sub>

- _(patch)_
  New `env()` in `@torpor/build/env` returns the server environment -- `process.env` on
  Node (with `.env` files loaded by the CLI) and the platform environment, with bindings,
  on Cloudflare. Its type comes from the `TorporEnv` global interface, declared in three
  layers: `@torpor/build` reserves framework keys (`TORPOR_SESSION_SECRET`), adapters add
  their platform's keys (the Cloudflare adapter declares `ASSETS`), and apps merge their
  own in an ambient `src/env.d.ts`. For runtime checking, set a Standard Schema on
  `site.env` in site.config.ts -- `env()` then validates on first use per request and
  throws with the schema's issues, so a missing or invalid key fails immediately instead
  of passing `undefined` along.

## 1.0.4

<sub>2026-09-10</sub>

- _(patch)_ Updated dependency `@torpor/build` v1.2.0

## 1.0.3

<sub>2026-09-09</sub>

- _(patch)_ Updated dependency `@torpor/build` v1.1.0

## 1.0.2

<sub>2026-09-08</sub>

- _(patch)_ Updated dependency `@torpor/build` v1.0.2

## 1.0.1

<sub>2026-09-08</sub>

- _(patch)_
  Fix: the Cloudflare adapter now points the dev template and the production worker's
  `Server` import at the compiled dist entries of `@torpor/build`, falling back
  to source files only when the framework is symlinked into the app (or
  `TORPOR_SOURCE_DEV` is set), matching the new source-mode behavior of `tb`.

## 1.0.0

<sub>2026-09-03</sub>

- _(major)_ Version 1 is here!
- _(minor)_
  The adapter now works as a Vite plugin, with built-in Cloudflare dev mode, and sites no longer require a `site.html` file.

## 0.2.3

### Patch Changes

- b9978f9: Fix: include \_worker.ts in dist files

## 0.2.2

### Patch Changes

- 802cb4c: Chore: only publish files in the dist folder
- Updated dependencies [802cb4c]
  - @torpor/build@0.4.10

## 0.2.1

### Patch Changes

- Updated dependencies [168dff3]
- Updated dependencies [051998b]
  - @torpor/build@0.4.0

## 0.2.0

### Minor Changes

- 51dbba7: Chore: drop CJS build and go ESM only

### Patch Changes

- Updated dependencies [bbdc8d3]
- Updated dependencies [e1ae2bb]
- Updated dependencies [51dbba7]
- Updated dependencies [62b0d2e]
  - @torpor/build@0.3.0

## 0.1.0

### Minor Changes

- b716d5c: Feat: inline styles during SSR

### Patch Changes

- Updated dependencies [a4f2573]
- Updated dependencies [67e6ca6]
- Updated dependencies [b716d5c]
  - @torpor/build@0.2.0

## 0.0.33

### Patch Changes

- @torpor/build@0.1.31

## 0.0.32

### Patch Changes

- @torpor/build@0.1.30

## 0.0.31

### Patch Changes

- @torpor/build@0.1.29

## 0.0.30

### Patch Changes

- Updated dependencies [fa85b57]
  - @torpor/build@0.1.28

## 0.0.29

### Patch Changes

- Updated dependencies [bed55d5]
  - @torpor/build@0.1.27

## 0.0.28

### Patch Changes

- Updated dependencies [348cd75]
  - @torpor/build@0.1.26

## 0.0.27

### Patch Changes

- Updated dependencies [3fe0d0e]
- Updated dependencies [f26603f]
  - @torpor/build@0.1.25

## 0.0.26

### Patch Changes

- d6b06ab: Fix: move from Cloudflare Pages to Workers
- Updated dependencies [6092a91]
  - @torpor/build@0.1.24

## 0.0.25

### Patch Changes

- c37269f: Fix: move from Cloudflare Pages to Workers

## 0.0.24

### Patch Changes

- 22f62d4: Fix: Site.viteConfig settings
- Updated dependencies [22f62d4]
  - @torpor/build@0.1.23

## 0.0.23

### Patch Changes

- Updated dependencies [4e0ec90]
  - @torpor/build@0.1.22

## 0.0.22

### Patch Changes

- Updated dependencies [4296742]
  - @torpor/build@0.1.21

## 0.0.21

### Patch Changes

- Updated dependencies [a61f30f]
  - @torpor/build@0.1.20

## 0.0.20

### Patch Changes

- Updated dependencies [170c886]
  - @torpor/build@0.1.19

## 0.0.19

### Patch Changes

- @torpor/build@0.1.18

## 0.0.18

### Patch Changes

- Updated dependencies [7373f27]
- Updated dependencies [679a448]
- Updated dependencies [e5b761b]
  - @torpor/build@0.1.17

## 0.0.17

### Patch Changes

- Updated dependencies [9332635]
  - @torpor/build@0.1.16

## 0.0.16

### Patch Changes

- @torpor/build@0.1.15

## 0.0.15

### Patch Changes

- Updated dependencies [e395c9e]
  - @torpor/build@0.1.14

## 0.0.14

### Patch Changes

- 2272579: Feat: allow passing extra inputs to build

## 0.0.13

### Patch Changes

- Updated dependencies [02eac8e]
  - @torpor/build@0.1.13

## 0.0.12

### Patch Changes

- 018728f: Fix: build for server (not browser)

## 0.0.11

### Patch Changes

- 3ed8a23: Chore: specify exports in packages

## 0.0.10

### Patch Changes

- Updated dependencies [8de094b]
  - @torpor/build@0.1.12

## 0.0.9

### Patch Changes

- 858538b: Fix: move adapter to globalThis, pass it to server loads
- Updated dependencies [858538b]
  - @torpor/build@0.1.11

## 0.0.8

### Patch Changes

- 5df2010: Fix: force disabling Vite preload

## 0.0.7

### Patch Changes

- @torpor/build@0.1.10

## 0.0.6

### Patch Changes

- 095c6c5: Feat: `adapter` object for adapter functionality
- Updated dependencies [ff685cb]
  - @torpor/build@0.1.9

## 0.0.5

### Patch Changes

- Updated dependencies [fe7444e]
  - @torpor/build@0.1.8

## 0.0.4

### Patch Changes

- @torpor/build@0.1.7

## 0.0.3

### Patch Changes

- 47c5277: Chore: update dependencies
- Updated dependencies [47c5277]
  - @torpor/build@0.1.6

## 0.0.2

### Patch Changes

- Updated dependencies [5c9d90f]
  - @torpor/build@0.1.5
