# torpor/build

A framework for building sites and apps with Torpor.

Built on top of [Vite](https://vite.dev).

## Installation

Use `npm` (or your preferred package manager) to create a starter project:

```bash
npm init @torpor/build@latest my-project
cd my-project
npm install
npm run dev
```

## Features

- Configure the `Site` class in your `site.config.ts` with routes and adapters
- Setup code-based routing (with `site.addRoute`)
- Or file-based routing (with `site.addRouteFolder`)
- Pages and API endpoints, with layouts and error pages
- A `tb` command line interface:
  - `tb --dev` -- start the dev server
  - `tb --build` -- create a production build
  - `tb --preview` -- preview the production build
  - `tb --openapi [outFile]` -- generate an OpenAPI document
- Adapters for deployment targets -- see
  [@torpor/adapter-node](../adapters/adapter-node),
  [@torpor/adapter-cloudflare](../adapters/adapter-cloudflare) and
  [@torpor/adapter-electron](../adapters/adapter-electron)
- Schema validation for endpoints (`@torpor/build/schema`)
- Form helpers (`@torpor/build/form`) and client side navigation helpers
  (`@torpor/build/nav`)
- `$page` state for pages (`let { $page } = $context`) and response helpers
  (`@torpor/build/response`)

## Folder structure

- /src
  - /assets
  - /components
  - /lib
  - /routes
    - /api

## Maybe

Ideally, sites built with torpor/build will be easy to get set up and running, with flexible overrides for complex uses.

- middleware setup for auth etc
- file-based routing by default, with programmatic overrides
- type-safe routing and fetching
- type-safe websocket communication
- immediate or scheduled background tasks
- authentication and authorization
- localization and internationalization
- logs and (basic) analytics

## Routing

TODO:

File based routing with overrides.

## Layouts

A `_layout.ts` in a route folder wraps every page in and below that folder:

```ts
// src/routes/_layout.ts
import component from "@/views/Layout.torp";
import { type PageEndPoint } from "@torpor/build";

export default {
	component,
} satisfies PageEndPoint;
```

The layout component renders the page through a `<slot />`:

```html
<!-- src/views/Layout.torp -->
<header>...</header>
<main>
	<slot />
</main>
```

Layouts nest: a `docs/_layout.ts` wraps the pages in `docs`, inside the root
`_layout.ts`. A layout can also load its own data with a sibling
`_layout.server.ts`.

**What a layout sees:**

- `$props.data` -- the merged output of every load that ran for the page it's
  wrapping: each layout's own load, plus the page's. On a client-side
  navigation that keeps the layout on screen, its `$props.data` is pointed at
  the new page's data, so a layout can branch on page data and stays correct
  after navigations (a full page load already re-renders it with fresh data).
- `$page` -- through `let { $page } = $context`: the page state (`url`,
  `status`, `form`, `flash`, `error`, `meta`), kept current on every
  navigation.
- `$page.meta` -- static data a page declares for its layouts, e.g.
  `meta: { bare: true }` in the page's endpoint (`+page.ts`). Use it to leave
  elements out for particular pages (a header for most pages, none on sign-in)
  without those pages having to run a load.

A layout renders before its `<slot />`, and on client-side navigation it is
reused rather than re-created: it renders once, and its data follows the page
being shown. When a page (or an error page) can't load its data -- offline, or
the server is down -- it renders over the live layouts, which keep the last
good page's data.

## Middleware

TODO:

## API versioning

TODO:
