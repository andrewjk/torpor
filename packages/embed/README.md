# @torpor/embed

Load and render torpor components that were authored at runtime — REPL
output, a social feed's user-created posts, a business suite's admin-built
custom sections — anywhere a `.torp` file can't be.

## How it works

An embed is a component compiled **at publish time** and stored as plain,
JSON-serializable data:

```
.torp source ──compileEmbed()──▶ EmbedArtifact ──store/serve──▶ mountEmbed()
 (admin saves)     (server)        (in your DB)                   (client)
```

- `compileEmbed` (from `@torpor/embed/server`) runs once when the author
  saves. It produces both builds of the component plus its styles, and
  stamps them with the `@torpor/view` version they were built against.
- `mountEmbed` / `hydrateEmbed` (from `@torpor/embed`) run on the client:
  they evaluate the artifact's client code against the runtime the host app
  already has, inject the scoped styles, and give you a handle to unmount.

Because the artifact is data, the usual torpor flow still applies: render
the server build to HTML on the server, hydrate it on the client with the
same props.

## Scope: host components inside embeds

Embeds can import from host modules -- your UI kit, your helpers -- and the
host provides the actual values at mount/render time:

```ts
// the embed's source
import { Form } from "@example/ui";

export default function Section() {
	@render {
		<Form>...</Form>
	}
}
```

```ts
// compile time: optionally whitelist which modules the embed may import
const artifact = compileEmbed("section-42", source, { scope: ["@example/ui"] });
// artifact.imports records what was imported: [{ source: "@example/ui", names: ["Form"] }]

// mount/render time: provide the values
mountEmbed(target, artifact, props, { scope: { "@example/ui": uiExports } });
renderEmbed(artifact, { props, scope: { "@example/ui": serverExports } });
```

Provide **client builds** of your components to `mountEmbed`/`hydrateEmbed`
and **server builds** to `renderEmbed`, exactly like your own app does. The
loaders validate `artifact.imports` against the flattened scope and fail
loudly naming the missing bindings, so a forgotten module is an actionable
error instead of a ReferenceError inside compiled code.

Scope values are host-side objects and cannot be serialized, so they cannot
cross the iframe boundary or the worker/service boundary -- sandboxed frames
use slots and the bridge; `renderEmbed({ isolate: true })` rejects scoped
artifacts.

## The compile entry

`@torpor/embed/compile` is the compiler with **no Node builtins**: it runs
in Node, Cloudflare Workers, and browsers alike (compile-on-save in a web
admin, or in the admin's browser). It exports `compileEmbed`,
`recompileEmbed`, and `RUNTIME_VERSION` (the @torpor/view version this
package was built against -- used to stamp artifacts, no runtime package
reads needed):

```ts
import { compileEmbed, RUNTIME_VERSION } from "@torpor/embed/compile";
const artifact = compileEmbed(id, source); // version defaults to RUNTIME_VERSION
```

`@torpor/embed/server` re-exports all of it plus the Node-only renderers
(`renderEmbed`, worker isolation, render service). Server-side rendering of
**JS-format** artifacts requires Node (workerd bans `new Function`); on
Workers, compile to a **restricted** artifact and render it with
`renderRestricted` from `@torpor/embed/restricted` — that entry is edge-safe.

The compiler also takes `maxSourceBytes` as a backstop against runaway
author input (rejected with a compile error, so the editor can show it
inline).

## Upgrades and recovery

On a @torpor/view upgrade, stale artifacts fail loudly at serve time. The
recovery path is built in:

```ts
import { assertRunnable, getRuntimeVersion, recompileEmbed } from "@torpor/embed/server";

// in the request path: render a placeholder while a job recompiles
assertRunnable(artifact, getRuntimeVersion());
// bulk job: recompile from source (the source of truth); meta is preserved
const fresh = recompileEmbed(artifact);
```

## Usage

Publish (server side, or anywhere -- see the compile entry above):

```ts
import { compileEmbed, assertRunnable, getRuntimeVersion } from "@torpor/embed/server";

// When the author saves
const artifact = compileEmbed("section-42", source);
await db.embeds.save(artifact); // includes artifact.source -- keep it!

// When serving, e.g. after a runtime upgrade
assertRunnable(artifact, getRuntimeVersion()); // throws if it needs a recompile
```

Render (client side):

```ts
import { createBridge, mountEmbed, hydrateEmbed } from "@torpor/embed";

// One bridge can serve every embed on the page; handlers learn which
// artifact called from `source`
const bridge = createBridge({
	onEvent: (type, detail, source) => track(source.artifactId, type, detail),
	invoke: async (method, payload, source) => {
		// Data flows through your backend, authenticated as the current user
		return api.call(method, { payload, embedId: source.artifactId });
	},
});

// Client-rendered
const handle = mountEmbed(target, artifact, { sectionId: 42 }, { bridge });
handle.unmount();

// Or hydrate markup that the server rendered from the same artifact + props
hydrateEmbed(target, artifact, { sectionId: 42 }, { bridge });
```

Server-render (from `@torpor/embed/server`):

```ts
import { createBridge, renderEmbed } from "@torpor/embed/server";

// Renders to HTML; hydrateEmbed the result with the same props + bridge
const { body, head, styles } = await renderEmbed(artifact, {
	props: { sectionId: 42 },
	bridge, // available to the embed during render (e.g. @await data fetches)
	scope, // host components for the embed's server build
	isolate: true, // render in a worker thread with a hard timeout
	timeout: 5000,
});
```

Place `head` in the page `<head>` -- for artifacts with `@style` it carries
the embed's scoped styles alongside its `@head` output, so server-rendered
content is styled from the first paint. `styles` exposes the same CSS
separately, for hosts that place styles themselves -- pick one (using both
double-injects), and pass `styles: false` to `hydrateEmbed` when the
server side already handled it.

`isolate: true` runs the render in a worker thread and terminates it at the
timeout, so a runaway embed can't take your server down. It's fault
isolation, not a security boundary (workers share the process): for
untrusted authors, skip server rendering entirely and render client-side in
a sandboxed iframe. Isolated renders also can't bridge host APIs during
render -- pass data as props instead; the worker fails loudly if an embed
tries.

## Restricted mode (no-eval SSR)

For server rendering where code generation from strings is unavailable
(Cloudflare Workers) or where author code must not run on your servers, compile
to a **restricted** artifact: the server build is a serialized instruction
tree, interpreted by trusted code — no `new Function`, no `eval`. The client
build is ordinary globals-format code.

```ts
import { compileRestricted, renderRestricted } from "@torpor/embed/restricted";

// Publish (edge-safe: runs on Node, workers, browsers). Data requirements
// come from the app manifest (see "App manifests" below)
const artifact = compileRestricted(id, source, {
	requirementKinds: { tickets: validateTicketSpec }, // spec shape validation
	data: manifest.data, // the app's declared data requirements
});

// Render (edge-safe; resolves data, then interprets the template)
const { body, head, styles } = await renderRestricted(artifact, {
	props: { queue: "open" },
	sources: {
		tickets: async (spec, { props }) => db.tickets.forTenant(tenant).list(spec),
	},
});
```

Data requirements are declared in the **app manifest** — inert JSON outside
the template (see **App manifests** below), so the .torp stays plain
torpor. Specs are inert data, implemented by the host.

- `sources` is the trusted boundary: authorization, tenant scoping and network
  access live there, never in the artifact. Data resolves per render under the
  _viewer's_ authority, so a shared embed only ever shows what its viewer
  could already see (see "Private when shared" under Trust model). Unknown
  kinds fail at compile time (`requirementKinds`). Pass `data` instead of
  `sources` when the host already fetched the data.
- Template expressions are a restricted op set — reads, literals, operators,
  optional chaining, array/object literals — **no calls**. Compute formatted
  values in a requirement spec or a `derive` (see below); the client build is
  full JS, so formatting helpers are fine there via `scope`.
- Rendering reuses the server build's value helpers (`t_fmt`, `t_class`,
  `t_style`, `t_attr`), so output matches the Node SSR path.
- **Auto-close guard**: a slot fill whose root tag the HTML parser would
  auto-close inside the host's wrapper (an `<li>` fill inside
  `<li><slot/></li>`, likewise `p`/`tr`/`td` shapes) re-nests the markup and
  breaks hydration — this fails at SSR with an error naming both tags and
  the fix. Wrap rows in a `<div>` (or start fills with a nesting-safe tag).
  Slot **fallbacks** with the same problem are rejected at compile time.
- **Hydration**: `renderRestricted` emits the same hydration markers as the
  Node server build, so `hydrateEmbed(target, artifact, { $data: data }, {
  styles: false })` adopts the painted HTML (byte-parity with the full server
  build is enforced by the parity suite). `mountEmbed(...)` still works for
  client-only rendering; the data bag is passed in props in both cases.
- **Client state works**: script bodies are stripped on the server but run on
  the client. `let $state = $watch({ count: $props.start ?? 0 })` initializers
  are serialized as restricted expressions over props — the server renders
  the initial paint from them, and the client build binds the real reactive
  `$watch` state, so counters, toggles and list mutations work after
  hydration. Initializers may reference only `$props` (plus literals and
  operators); template identifiers are validated at compile time
  (`$props`/`$data`/state names/loop variables), so typos fail at save time.
- v1 supports elements, text/interpolations, static/dynamic attributes,
  `@if`/`@else if`/`@else`, `@for` (single variable, `of`, optional `@key`),
  host components (`<Card title={x}>…</Card>`), `<slot>` elements (a
  slot renders its fallback; incoming fills are a host-side concern), and
  slot props on fills (a fill reads `$slot.<name>` for the props the host
  component passes to its slot).
  Deferred with clear compile errors: `@head`, `@html`, `@switch`, `@await`,
  `@try`, form bindings, mixed static/dynamic attribute values.

### Cross-artifact components

A restricted artifact can render **another restricted artifact** as a
component. Wrap the inner artifact with `restrictedComponent` — it becomes a
server component for the outer template's `components` map, with its own
data layer:

```ts
import { restrictedComponent } from "@torpor/embed/restricted";

const { body } = await renderRestricted(outerArtifact, {
	props,
	components: {
		TicketList: restrictedComponent(innerArtifact, {
			sources, // the inner artifact's own requirement sources
			formatters,
			deriveLimits,
		}),
	},
});
```

The outer template's fills become the inner artifact's incoming slots: the
inner `<slot item={row}>` evaluates its slot props in its own scope, calls
the outer fill's render, and falls back to its fallback children when the
outer passes no fill for that name. `renderRestricted` also takes `slots`
directly, so a host can supply fills for a top-level restricted template.
The inner artifact's styles are inlined into `head` as
`<style id='…'>…</style>` — the same emission as the JS server build — so
scoped-styled inner components render styled through the boundary.

On the **client**, pass the inner artifact's client build via the outer's
`scope` — it handles slots natively. An inner artifact with data
requirements needs its `$data` bag through props (the same contract as
hydration), so the host adapts:

```ts
import { loadComponent } from "@torpor/embed";
const inner = loadComponent(innerArtifact, scope);
hydrateEmbed(target, outerArtifact, props, {
	scope: {
		ui: {
			TicketList: ($p, $a, usageProps, $c, slots) =>
				inner($p, $a, { ...usageProps, $data }, $c, slots),
		},
	},
});
```

Wrapper cycles (`A` renders `B` renders `A`) recurse until the stack
overflows — construct component maps acyclically.

### Host components in restricted mode

Components resolve like everything else — host-side. At render time, pass
**server components** (their server builds); at mount time, pass the client
builds via `scope`:

```ts
const { body } = await renderRestricted(artifact, {
	components: { Card: cardServerComponent }, // server build: (props, ctx, slots) => {body, head}
});

mountEmbed(target, artifact, props, {
	scope: { "@mallet/ui": { Card: cardClientComponent } }, // client build
});
```

Fill children are interpreted in the ambient scope and passed as the
default slot; named fills (`<fill name="header">`) work the same, and fills
read slot props as `$slot.<name>`. Scoped classes work on component usages
too: a `class` that matches the template's `@style` selectors gets the
style-hash class merged through to the host component, exactly like the JS
builds. Unknown components fail at render time with their name — the host
decides whether that's a build failure or a graceful fallback.

- `recompileRestricted(artifact)` is the upgrade path for these artifacts
  (`recompileEmbed` covers the JS formats).

### The `http` source kind

`@torpor/embed/restricted` ships one generic mechanism so admins can point
requirements at JSON APIs the host was never told about — under operator
policy:

```ts
import { createHttpSource, httpRequirementKind } from "@torpor/embed/restricted";

const artifact = compileRestricted(id, source, {
	requirementKinds: { http: httpRequirementKind }, // authoring-time shape errors
	data: {
		tickets: {
			kind: "http",
			url: "https://api.corp.example/tickets", // string literal; props never reach the origin
			auth: "corp-key", // credential *name* (secret stays host-side)
			params: { queue: "$props.queue" }, // query params; values may be $props refs
			pick: "items", // dot path into the JSON response
			limit: 50,
		},
	},
});

const { body } = await renderRestricted(artifact, {
	sources: {
		http: createHttpSource({
			allowOrigins: [
				"https://api.corp.example", // default: deny all
				// per-origin policy: narrow which fields the artifact may see
				{ origin: "https://people.corp.example", allowFields: ["id", "name", "team"] },
			],
			credentials: { "corp-key": { value: process.env.CORP_KEY!, prefix: "Bearer " } },
			timeout: 5000,
			maxResponseBytes: 1_000_000,
			maxRows: 1000,
		}),
	},
});
```

Security posture, all enforced by `createHttpSource`:

- **Default deny** — origins not in `allowOrigins` are never fetched.
- **Field narrowing** — an origin given as `{ origin, allowFields }` limits
  what the artifact may see from it: every JSON object in the response (at
  every nesting level) is stripped to the allowlisted fields _before_ the
  author's `pick` runs, so a pick into a stripped path fails loudly instead
  of surfacing `undefined`. Narrowing also drops dangerous keys
  (`__proto__` & co.); misconfigured policies (duplicate origins,
  non-string fields, dangerous keys) throw at creation.
- Credentials are referenced by name; an unconfigured name errors with the
  _names_ configured, never another credential's value. Secrets never enter
  the artifact.
- GET only, redirects not followed, response must be JSON, and response
  bytes + array rows are capped.
- Literal private/loopback hosts are blocked even when allowlisted; DNS
  rebinding and outbound network control remain the deployment's job (route
  through an egress proxy via the `fetch` option, or `globalOutbound` on
  Workers).
- Response data is inert: `renderRestricted` escapes it like any other
  string, so a row containing markup renders as text.

### `derive`: the computation layer

Formatting and shaping belong in data, not templates — `derive` filters,
maps, sorts and limits an earlier requirement's rows, with host functions
callable here (and only here). In manifests, the expression values
(`where`, `map`, `sortBy`, the aggregates) are expression **strings**,
parsed at save time with the restricted expression grammar:

```ts
data: {
	view: {
		kind: "derive",
		of: "tickets",                        // an earlier requirement (array)
		where: "$item.priority >= 2",         // optional per-row filter
		map: { due: "formatDue($item.due)", isLate: "$item.due < now()" },
		sortBy: "$item.priority",
		order: "desc",                        // "asc" (default) | "desc"
		limit: 20,
	},
},
```

```ts
const { body } = await renderRestricted(artifact, {
	formatters: { formatDue: (d) => dateFmt.format(d as number), now: () => Date.now() },
	sources: { http: createHttpSource(…), rows: … },
	deriveLimits: { maxInputRows: 5000, maxOutputRows: 1000, timeoutMs: 50 },
});
```

- `$item`, `$index` and `$props` are in scope per row; the result (after
  `map`) ships in `$data` with the paint, so hydration never re-runs
  locale-sensitive formatting.
- Sorting is stable; `order` and `limit` are literals, `where`/`map`/`sortBy`
  are expressions. Derives resolve in declaration order, so `of` must name an
  earlier requirement (enforced at compile time with
  `requirementKinds: { derive: deriveRequirementKind }`).
- **Aggregates** — `count`, `sum`, `min`, `max`, `average` — produce a single
  object instead of rows, over the rows passing `where`:

  ```ts
  stats: {
  	kind: "derive",
  	of: "tickets",
  	where: "$item.open",
  	count: true,
  	sum: "$item.estimate",
  	average: "$item.estimate",
  	max: "$item.priority",
  },
  ```

  The template reads `$data.stats.count`, `$data.stats.sum`, … Nulls are
  skipped by the numeric aggregates (SQL-style); `count` counts filtered
  rows; an empty set gives `count: 0`, `sum: 0`, and `null` for
  `min`/`max`/`average`. Aggregates can't combine with `map`/`sortBy`/
  `order`/`limit` (compile error) — `sum`/`average` throw at resolve time on
  non-numeric values.

- Budgets are enforced (input rows, output rows, wall clock) and reported as
  render errors. Cross-source joins are deliberately out — correlate in the
  template or in a host-shaped source.
- Host functions are not available to template expressions; a missing
  formatter fails loudly, naming it.

### App manifests: where data requirements live

`@torpor/embed/app` is the author-facing manifest entry (edge-safe, no Node
builtins). `defineApp` types an app declaration and returns it unchanged --
plain JSON, so a host can store it and compile against it without executing
anything. All data requirements live here, keeping restricted templates
plain torpor:

```ts
// word-lookup.app.ts -- authored by the client, submitted as JSON
import { defineApp } from "@torpor/embed/app";

export default defineApp({
	id: "word-lookup",
	props: { word: "serendipity" },
	data: {
		entry: {
			kind: "http",
			url: "https://dictionaryapi.com/api/v3/references/collegiate/json",
			params: { word: "$props.word" }, // "$props.<path>" resolves per render
			auth: "mw", // credential *name*; secrets stay host-side
			pick: "0",
			limit: 5,
		},
	},
});
```

Compile against it with `compileRestricted`'s `data` option:

```ts
const artifact = compileRestricted("word-lookup", templateSource, {
	requirementKinds: { http: httpRequirementKind },
	data: manifest.data, // validated like in-torp requirements, at save time
});
```

Manifests are validated by the same requirement kinds, so unknown kinds and
malformed specs fail at save time. Requirements resolve in declaration
order, so `derive` entries can reference earlier ones. For validation-only
workflows (checking a submitted manifest before storing it),
`manifestRequirements` returns the same error list a compile would.

### Audit trail

`renderRestricted` takes `onAudit`, called once per resolved data
requirement with what was read — the "record what was read" half of the
trusted boundary:

```ts
const { body } = await renderRestricted(artifact, {
	sources,
	onAudit: (entry) => log.info("embed-read", entry), // artifactId, name, kind, spec, durationMs, ok, error?
});
```

Entries fire for host sources and `derive` alike, in declaration order, on
success and failure (failures are reported, then rethrown — auditing never
swallows an error). No entries when the host passes pre-resolved `data`,
because nothing was read. The `spec` in an entry is the inert declaration —
the url, the credential _name_, the pick path — never fetched data or
secrets. Wrapping an inner artifact with `restrictedComponent` passes your
`onAudit` through, so reads behind the component boundary are audited too.

## Module-format artifacts

By default artifacts compile to _globals format_: imports stripped, run by
the loader against injected runtime exports (works everywhere, including
sandboxed iframe frames). For in-process embeds you can instead compile to
_module format_ -- a real ES module with imports and its default export
intact:

```ts
const artifact = compileEmbed("section-42", source, {
	module: true,
	// Optional: point imports at a runtime URL your server hosts, so stored
	// artifacts keep importing the exact runtime they were built against
	resolveImport: (spec) =>
		spec === "@torpor/view" ? `/modules/@torpor/view@${getRuntimeVersion()}/index.mjs` : undefined,
});
```

Then load it asynchronously:

```ts
import { mountModuleEmbed, hydrateModuleEmbed } from "@torpor/embed";

const handle = await mountModuleEmbed(target, artifact, props, { bridge });
```

Module loading defaults to a blob-URL `import()`; an import map on the host
page resolves bare specifiers, rewritten URLs resolve directly, and hosts
with their own module pipeline can pass an `import` hook. Version checking
is stricter here: it runs against the installed runtime before loading.
The sync `mountEmbed` rejects module artifacts with a pointer to
`mountModuleEmbed`.

## Caching

Every loader takes `cache: true`, which stores the evaluated component
(globals format) or loaded module (module format) on the artifact object,
so mounting the same artifact many times -- a feed of posts, a dashboard
of sections -- evaluates its code once:

```ts
mountEmbed(target, artifact, props, { cache: true });
```

Caching is keyed by artifact object identity (a WeakMap, so it dies with
the artifact): refetching identical content produces a new cache entry,
which is what you want -- the new fetch may have been recompiled against a
newer runtime. Failed module loads are not cached; the next mount retries.

## The bridge

Embeds receive the bridge as a reserved `$embed` prop:

```ts
export default function FeedbackSection($props: { $embed: any }) {
	let reply = $watch("");
	async function submit() {
		reply.value = await $props.$embed.invoke("save-feedback", { text: "..." });
		$props.$embed.emit("submitted", { ok: true });
	}
	@render {
		<button onclick={submit}>Send</button>
	}
}
```

- `emit(type, detail)` is fire-and-forget: analytics, notifications.
- `invoke(method, payload)` is request/response: form submissions, tenant
  data. Values or promises the host handler returns are handed back to the
  embed.
- `on(type, handler)` receives pushes from the host -- the counterpart of
  `emit`, for data that changes while the embed is mounted (poll counts,
  shared checklists, dashboards). Update your own `$watch` state in the
  handler and the component re-renders. Returns an unsubscribe function.

Pushes go **host → embed only**. `createBridge` returns a controller whose
`push` fans out to every embed subscribed to a type, or to one artifact's
embeds:

```ts
// every mounted poll widget re-renders with the new count
bridge.push("votes-changed", { count: 18 });
// only this artifact's embeds
bridge.push("votes-changed", { count: 18 }, "poll-7");
```

`push` lives on the controller, not on the scoped `$embed` view embeds
receive -- subscribing is the embed's job, deciding what to push is the
host's. Frame embeds subscribe through the same `on`; the host listener
relays pushes across the postMessage boundary (see the frame protocol
below). Pushing requires passing a bridge: embeds mounted without one get
a private default bridge you can't reach. With no subscriber for a type,
a push is a silent no-op. (The scoping itself is `scopeBridge` -- the
helper the loaders apply per mount, exported for hosts building their own
loading paths.)

If a host mounts an embed without a bridge, a default bridge is injected
that warns on first use -- unwired embeds fail loudly in the console
instead of silently doing nothing. Embeds can also be given a bridge
explicitly through props (a `$embed` prop wins over `options.bridge`).

Typing: `EmbedBridge.invoke` is intentionally loose so hand-written bridges
work. For a typed contract, declare the method map once and derive a typed
bridge with `EmbedApiBridge` -- method names are checked, payloads are
required exactly when declared, and results are typed:

```ts
// shared between host and embed author
type SectionApi = {
	"fetch-data": { result: string };
	"save-section": { payload: { name: string }; result: "ok" };
};

// in the embed: const embed = $props.$embed as EmbedApiBridge<SectionApi>;
const data = await embed.invoke("fetch-data"); // Promise<string>
await embed.invoke("save-section", { name: "ada" }); // Promise<"ok">
await embed.invoke("nope"); // type error: not in the contract
```

A manual method-overload cast works the same way if you'd rather not use
the helper type.

For sandboxed embeds (see trust model below), mount the embed in a sandboxed
iframe with `mountEmbedFrame` -- it uses the same bridge interface over
postMessage, so embed code doesn't change between tiers:

```ts
import { mountEmbedFrame } from "@torpor/embed";
import runtime from "@torpor/view/runtime?raw";

const iframe = document.createElement("iframe");
container.appendChild(iframe);

const handle = mountEmbedFrame(
	iframe,
	artifact,
	{ postId: 7 },
	{
		runtime, // the bundle the frame runs the embed against
		bridge, // same createBridge() as in-process embeds
	},
);
// The frame reports its content height; the iframe auto-sizes.
// handle.unmount() stops listening and clears the frame.
```

The iframe gets `sandbox="allow-scripts"` (an opaque origin: no access to
the host page's DOM, storage, or cookies), and its document is fully
authored by you -- runtime + compiled artifact + bootstrap -- so the frame
can only run code you compiled. Invoke payloads and props must be
serializable (they cross as structured clone).

For pages with many frames (a feed), pass `runtimeUrl` instead of
`runtime`: the frame loads the runtime from a URL your server serves, so
the browser caches one download for every embed instead of inlining ~36KB
per frame. The URL must serve the same runtime version the artifact was
compiled with.

Two more frame options:

- `css` -- your theme (custom properties, base styles), injected into the
  frame document _before_ the artifact's styles, so a sandboxed frame
  inherits the host's look-and-feel while the embed can still override.
- `maxHeight` -- clamps the frame's auto-height reports.

Form-bearing embeds (polls, surveys) need `sandbox: "allow-scripts
allow-forms"` -- without `allow-forms`, native form posts silently no-op
inside the frame.

## URL-served frames

`mountEmbedFrame` builds the frame document client-side into `srcdoc`. You
can also serve the document from your own URL -- the model where the code
stays on its author's origin and the frame response carries its own
headers (which `srcdoc` frames can't do: they inherit the _parent's_ CSP):

```ts
// server: the frame endpoint's response body
import { frameDocument } from "@torpor/embed";
app.get("/embeds/:id/frame", () => frameDocument({ artifact, props, runtimeUrl }));

// client: pair the iframe with the host side of the protocol
import { listenEmbedFrame } from "@torpor/embed";
const listener = listenEmbedFrame(iframe, { artifactId: "section-42", bridge, maxHeight: 600 });
listener.dispose(); // stops listening
```

`listenEmbedFrame` is the extracted host side of the frame protocol
(`event.source` validation, call-id routing, height handling) -- use it
whenever the frame document wasn't created by `mountEmbedFrame`. If your
frame document is raw HTML/CSS/JS (no torpor runtime at all), inline
`frameBridgeScript` instead of the full `frameScript` -- it sets up
`TorporEmbed.bridge` and height reporting without any component glue:

```html
<script>
	${frameBridgeScript}
</script>
<script>
	window.redraft = {
		submit: (payload) => window.TorporEmbed.bridge.invoke("submit", payload),
		get: (query) => window.TorporEmbed.bridge.invoke("get", query),
	};
</script>
```

If you compose your own frame documents, `safeJson` (for JSON inside `<script>`)
and `safeAttribute` (for URLs in attributes) are exported and stable --
they are exactly the escaping the built-in document builder uses, and
other hosts depend on them.

## Frame protocol

The postMessage contract lives in `src/frame/protocol.ts` (`FrameToHost`,
`HostToFrame`, `EMBED_CHANNEL`) -- that module is the authoritative
description:

- frame -> host: `{ channel, kind: "event", type, detail }`,
  `{ channel, kind: "invoke", call, method, payload }`,
  `{ channel, kind: "height", value }`,
  `{ channel, kind: "subscribe", type }` (sent once per type, on the first
  `bridge.on` for it)
- host -> frame: `{ channel, kind: "invoke-result", call, value }`,
  `{ channel, kind: "invoke-error", call, message }`,
  `{ channel, kind: "push", type, detail }` (relays `bridge.push` to
  subscribers registered on the host bridge by the frame's listener)

Validation rules (the part hosts re-implementing it most often get wrong):

- With an opaque origin, `event.origin` is "null" and useless -- validate
  `event.source` instead. The frame accepts only its direct parent; the
  host accepts only the frame's `contentWindow`.
- The host replies with targetOrigin `"*"`, safe only because the frame's
  document is host-authored. If a frame ever loads remote content, that
  assumption breaks.
- Unknown channels are ignored, so a channel mismatch between the two
  sides fails silently by design. Both sides default to `EMBED_CHANNEL`;
  pass `channel` to `frameDocument`/`mountEmbedFrame`/`listenEmbedFrame`
  (or build custom scripts with `createFrameScript(channel)` /
  `createFrameBridgeScript(channel)`) only if you know both sides agree.

## CSP

Content-Security-Policy interactions, per tier and format:

- **Globals-format embeds** (`mountEmbed`) evaluate compiled code with
  `new Function`, which requires `script-src 'unsafe-eval'`. That's the
  price of running stored code; module format doesn't need it.
- **Module-format embeds** (`mountModuleEmbed`) load via blob-URL
  `import()`: allow `script-src blob:` (plus whatever your import map
  points at).
- **`srcdoc` frames** inherit the _parent page's_ CSP, so a strict
  `script-src` on your app also applies inside the frame -- inline scripts
  there need `'unsafe-inline'` or nonces, or serve the frame from a URL
  with its own headers instead.
- **URL-served frames** set their own CSP headers, e.g.
  `Content-Security-Policy: sandbox allow-scripts; default-src 'none';
  style-src 'unsafe-inline'; script-src 'unsafe-inline'`, plus
  `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.

For nonce-based policies, pass `nonce` to the loaders (the injected
`<style>` gets it), to `mountEmbedFrame` (every `<script>` and `<style>`
in the frame document gets it), or include it in your own URL-served frame
headers.

## Version policy

Compiled embed code references the runtime's internal helpers (`t_anchor`,
`t_fragment` etc.), which change between releases. The policy is therefore
exact: an artifact runs only against the `@torpor/view` version it was
compiled with.

- Store `artifact.source` as the source of truth; the compiled code is a
  cache. After a runtime upgrade, recompile stale artifacts.
- Pass `runtimeVersion` to `mountEmbed`/`hydrateEmbed` to enforce this on
  the client, and use `assertRunnable` on the server. `allowMismatch` turns
  the throw into a warning for preview environments.

## Trust model

An embed is arbitrary code from an author you may not trust. Default to the
strictest model and loosen deliberately:

- **Untrusted authors** (public posts, REPL output): run in a sandboxed
  iframe; the artifact's client code + the `@torpor/view/runtime` bundle are
  all an iframe needs.
- **Semi-trusted authors** (paying admins): mounting in the host page is
  reasonable, but pass only vetted data through props, and gate what the
  embed can reach on the server.
- **Server-side rendering of embeds executes author code on your
  infrastructure.** Contain it before rendering embeds from authors you
  don't fully trust (see the render service below).
- **Private when shared**: rendered output must only ever be visible to
  viewers who already have access to the data behind it. Data resolves
  per render under the _viewer's_ authority -- per-user/tenant props,
  sources scoped to the requesting user -- never baked into the artifact,
  never cached across viewers, and never fetched with the _author's_
  credentials.

Props in, events out: hosts pass data as props (per user/tenant -- never in
module scope) and embeds talk back through the `$embed` bridge (see above),
whose handlers the host controls.

Writes deserve more friction than reads. `invoke` is the embed's write
path, so classify methods up front and gate the mutating ones behind an
approval step -- the handler, not the embed, decides whether the write
happens:

```ts
const WRITES = new Set(["save-section", "delete-section"]);

createBridge({
	invoke: async (method, payload, source) => {
		if (!WRITES.has(method)) return api.call(method, { payload, embedId: source.artifactId });
		// Mutating methods queue for human approval; the embed gets a
		// pending receipt and shows its own waiting state
		const request = await approvals.queue(source.artifactId, method, payload);
		return { status: "pending", requestId: request.id };
	},
});
```

The approved request should execute in the approver's session, not the
viewer's; until then the embed sees only the pending receipt. No API
changes are needed for this -- it is a discipline for `invoke` handlers.

When the author is an AI (an agent building sections from a prompt), treat
it as untrusted by default: restricted mode (`compileRestricted` +
`renderRestricted`) keeps the author's code off your servers entirely, and
its compile-time validation catches hallucinated syntax and spec shapes at
save time, where the editing UI can show them.

## Render service

`isolate: true` renders in a worker thread, which is **fault isolation,
not a security boundary** -- workers share the process's memory and Node
builtins. The real boundary is a separate container, and
`@torpor/embed/server` ships the protocol for exactly that:

```ts
// render-service.mjs -- runs in the container, nothing else
import { startRenderServer } from "@torpor/embed/server";

await startRenderServer({ port: 8080, token: process.env.RENDER_TOKEN });
```

```ts
// your app -- a drop-in replacement for renderEmbed
import { createServiceRenderer } from "@torpor/embed/server";

const render = createServiceRenderer({
	url: "http://render-pool.internal:8080",
	token: process.env.RENDER_TOKEN,
});
const { body, head } = await render(artifact, { props, timeout: 5000 });
```

The container is the security boundary -- lock it down accordingly:
non-root user, read-only root filesystem, **no network egress** (your app
calls it; it never calls out), memory and CPU limits, and a minimal image.
The service binds loopback by default and requires a bearer token when one
is configured.

Notes:

- Slots and the host bridge are functions and cannot cross the service
  boundary -- pass data as props; requests carrying slots are rejected.
- The service runs its own runtime version and rejects artifacts it can't
  run with 409 -- recompile them from `artifact.source` (or query
  `GET /version` from your deploy script to detect drift).
- Run a pool of these behind your orchestrator; renders are stateless.

## `@torpor/view/runtime`

The same runtime also ships as a single self-contained, minified browser
bundle with all exports attached to the `TorporView` global:

```html
<script src=".../node_modules/@torpor/view/dist/runtime.iife.js"></script>
<script>
	Object.assign(globalThis, TorporView);
</script>
```

This is what sandboxed iframes and REPLs (including torpor's own site REPL)
run compiled code against.

## Roadmap

- Single-process isolation research: a WASM engine (e.g. QuickJS) running
  the SSR runtime with no Node builtins, as an alternative to the
  container-based render service. Unverified whether torpor's async SSR
  drains correctly there; the render service is the supported path today.
