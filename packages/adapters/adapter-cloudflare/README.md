# torpor/adapter-cloudflare

A @torpor/build adapter for deploying to Cloudflare Pages.

## Installation

Install the adapter using `npm` (or your preferred package manager):

```bash
npm install @torpor/adapter-cloudflare
```

Then use the adapter in your `site.config`:

```javascript
import { cloudflare } from "@torpor/adapter-cloudflare";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = cloudflare;
```

## Compatibility flags

Torpor keeps each request's page state (`$page`) separate with
`AsyncLocalStorage`, which Workers provide behind the `nodejs_als` (or
`nodejs_compat`) compatibility flag. The generated `dist/wrangler.toml` sets it;
if you deploy with your own wrangler config, add it there too:

```toml
compatibility_flags = ["nodejs_als"]
```

Without it, the server logs a warning and concurrent requests share one page
state, so one request can see another's url, flash message or form result.

## Request context

The worker puts Cloudflare's `env` and execution context on `globalThis.adapter`,
where endpoints and hooks can reach them as `event.adapter.env` and
`event.adapter.ctx` (or `globalThis.adapter.env` / `.ctx` anywhere else).
`ctx.waitUntil(promise)` schedules background work that keeps running after the
response is sent:

```typescript
export default function endpoint() {
	return async (ev) => {
		ev.adapter.ctx?.waitUntil(logRequest(ev.request));
		return new Response("ok");
	};
}
```

(`ctx` is only present on Cloudflare; guard for other adapters.)
