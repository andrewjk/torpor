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
(`renderEmbed`, worker isolation, render service). Server-side rendering
requires Node: workerd bans `new Function`, so on Workers the supported
mode is client-only (store the artifact, mount it in the browser).

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

Place `head` in the page `<head>` -- it carries the embed's `@head` output
_and_ its scoped styles, so server-rendered content is styled from the
first paint (pass `styles: false` to `hydrateEmbed` when the server already
inlined them, to avoid duplicate style tags).

`isolate: true` runs the render in a worker thread and terminates it at the
timeout, so a runaway embed can't take your server down. It's fault
isolation, not a security boundary (workers share the process): for
untrusted authors, skip server rendering entirely and render client-side in
a sandboxed iframe. Isolated renders also can't bridge host APIs during
render -- pass data as props instead; the worker fails loudly if an embed
tries.

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

If a host mounts an embed without a bridge, a default bridge is injected
that warns on first use -- unwired embeds fail loudly in the console
instead of silently doing nothing. Embeds can also be given a bridge
explicitly through props (a `$embed` prop wins over `options.bridge`).

Typing: `EmbedBridge.invoke` is intentionally loose so hand-written bridges
work. To type a specific embed's calls, declare the method overloads once
and cast:

```ts
// shared between host and embed author
type SectionApi = {
	invoke(method: "fetch-data"): Promise<string>;
	invoke(method: "save-section", payload: { name: string }): Promise<"ok">;
	emit(type: "submitted", detail?: { ok: boolean }): void;
	emit(type: string, detail?: unknown): void;
};

// in the embed: const embed = $props.$embed as SectionApi;
```

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
whenever the frame document wasn't created by `mountEmbedFrame`. If you
compose your own frame documents, `safeJson` (for JSON inside `<script>`)
and `safeAttribute` (for URLs in attributes) are exported and stable --
they are exactly the escaping the built-in document builder uses, and
other hosts depend on them.

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

Props in, events out: hosts pass data as props (per user/tenant -- never in
module scope) and embeds talk back through the `$embed` bridge (see above),
whose handlers the host controls.

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
