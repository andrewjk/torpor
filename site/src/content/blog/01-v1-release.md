---
title: Torpor v1 Release
publish_date: 2026-09-04
---

Torpor v1 has been released and it has a new website. Click around to see
what you can do with it!

## Features

Torpor is a full-stack JavaScript framework that aims for simplicity and
completeness. It has the following features:

- Compose your views with JavaScript, HTML and CSS
- Components are functions with script, markup and styles
- In-markup JavaScript logic with `@if`, `@for`, `@switch`, `@try`, and `@await` keywords
  - And `@replace`, `@const`, `@console`, `@debugger`, `@function` and `@html`
- Runtime reactivity via proxies that can be used in any JavaScript file
- Scoped styles, two-way binding, child components [and more](/docs)
- An [accessible, unstyled component library](/ui)
- A [full-featured site and app framework](/build)

## What's new

If you've been using a pre-release version, you can now use the following features:

- Error boundaries: `@try`/`@catch`, and a top-level `@error` block
- Async getters: `$async` with the `@await`/`with` boundary, plus `$pending` and `$refresh`
- External event streams: `$stream` with `fromServer`, `fromWebSocket` and `fromElement`

And you will need to remove any old `@await (promise) { ... } then (v) { ... } catch (e) { ... }`
controls by putting the promise in an `$async` getter,
reading it inside `@await` ... `with`, and catching
errors with `@try` — see [Async](/docs/async) and
[Errors](/docs/errors).
