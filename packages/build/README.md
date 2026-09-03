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
  [@torpor/adapter-node](../adapters/adapter-node) and
  [@torpor/adapter-cloudflare](../adapters/adapter-cloudflare)
- Schema validation for endpoints (`@torpor/build/schema`)
- Form helpers (`@torpor/build/form`) and client side navigation helpers
  (`@torpor/build/nav`)
- `$page` state for pages (`@torpor/build/state`) and response helpers
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

TODO:

## Middleware

TODO:

## API versioning

TODO:
