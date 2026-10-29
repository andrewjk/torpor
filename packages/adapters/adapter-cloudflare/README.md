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
