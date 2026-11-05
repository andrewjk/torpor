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

## Usage

Publish (server side):

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

For sandboxed embeds (see trust model below), the same interface is what a
postMessage-based bridge will implement; embed code doesn't change.

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
  infrastructure.** Sandbox it (isolated context, timeouts, no ambient
  authority) before rendering embeds from authors you don't fully trust.

Props in, events out: hosts pass data as props (per user/tenant -- never in
module scope) and embeds talk back through the `$embed` bridge (see above),
whose handlers the host controls.

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

- Server-side render sandbox for untrusted authors
- PostMessage bridge (same `EmbedBridge` interface) for sandboxed-iframe
  embeds
- Import-map mode for artifacts (real ES modules instead of injected globals)
