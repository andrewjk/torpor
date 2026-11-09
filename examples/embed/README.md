# Embed host — built with @torpor/build

A sample **embed platform** as a normal torpor site: the site owns storage,
routing, HTML and data policy; `@torpor/embed` supplies only the primitives
to compile, render and hydrate restricted `.torp` apps. Apps are deployed at
runtime — the site never changes.

## The site

| Path                     | What it is                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| `site.config.ts`         | A `@torpor/build` `Site` with the Node adapter                      |
| `src/routes/`            | Pages and API routes                                                |
| `src/lib/store.ts`       | The site's storage (a folder of JSON), seeding, and the data policy |
| `src/lib/bridge.ts`      | The host bridge: what apps' `$embed.invoke(...)` calls reach        |
| `src/lib/submissions.ts` | Site storage for bridge submissions (a JSON file)                   |
| `src/views/`             | The site's own page components                                      |
| `seed/`                  | Starter apps: `.torp` + an inert manifest (`.json`)                 |
| `apps/`                  | Deployed apps (runtime state, gitignored)                           |

Routes:

- `GET /` — list of deployed apps (`+page.server.ts` load → page component)
- `GET /apps/[id]` — a full page for an app: the server load calls
  `renderRestricted` (the SSR paint), the page component hydrates it with
  `hydrateEmbed` after mount — passing the host bridge
- `GET /render?id=…&<props>` — the embeddable fragment:
  `{ html, head, styles, data, props }`, rendered through the site's policy
- `GET /artifact.json?id=…` — the compiled artifact (for hydration)
- `POST /artifacts` — deploy `{ id, source, props?, data? }`; compiled at
  save time and stored
- `GET /apps` — JSON list of deployed apps
- `GET|POST /api/submissions` — the bridge target; `GET /submissions` lists
  what apps have submitted
- `GET /api/lookup?word=…` — bridge target for dictionary lookups; resolves
  through the site's data policy and records the looked-up word

## The flow

1. **Author** — a plain restricted `.torp` template plus an inert manifest
   (typed with `defineApp` from `@torpor/embed/app`):

   ```ts
   // word-lookup manifest (see seed/WordLookup.json) — free, keyless API
   {
   	"id": "word-lookup",
   	"props": { "word": "serendipity" },
   	"data": {
   		"entry": {
   			"kind": "http",
   			"url": "https://api.datamuse.com/words",
   			"params": { "sp": "$props.word", "md": "d", "max": 1 },
   			"pick": "0",
   			"limit": 1
   		}
   	}
   }
   ```

2. **Deploy** — `POST /artifacts { id, source, props?, data? }`:
   `compileRestricted` produces an inert artifact (serialized instruction
   tree + client build) and the site stores it.

3. **Render** — `renderRestricted` resolves the manifest's requirements
   through the site's `createHttpSource` policy and interprets the tree to
   HTML. Nothing author-written runs.

4. **Hydrate** — the page component calls
   `hydrateEmbed(root, artifact, { ...props, $data: data })`. The site
   bundles the embed SDK and runtime, so no import map or inline scripts are
   needed, and client-side navigation works.

## Run it

```sh
pnpm install        # from the repo root (examples/* are workspace packages)
pnpm --filter @torpor/examples-embed dev
# → http://localhost:7059
```

Production: `pnpm --filter @torpor/examples-embed build` and
`pnpm exec tb --preview` (or deploy `dist/` with the Node adapter).

Both seed apps use free, keyless APIs — wiki-cards pulls Wikipedia
summaries, word-lookup pulls WordNet definitions from Datamuse. Neither
needs an environment variable.

## Bridge: apps talking to the host

Embedded apps talk back through the bridge. In a **restricted** component,
template expressions can never call it (nothing author-written runs on the
server), but the app's event handlers are ordinary client JS and receive the
bridge as the reserved `$props.$embed` prop. Replies land in `$watch` state
and render reactively — `invoke` is a real round trip, so apps can _display_
host data too:

```torp
async function lookUp() {
	const reply = await $props.$embed.invoke("lookup", { word: $state.query });
	if (reply.ok) $state.lookup = { word: reply.word, defs: reply.defs };
}

$onmount(() => {
	refresh(); // e.g. "signatures" — already-signed names
});
```

The host owns the methods (`src/lib/bridge.ts`); this sample exposes:

| Method       | Payload         | Reply                                      | Used by                      |
| ------------ | --------------- | ------------------------------------------ | ---------------------------- |
| `submit`     | `{ app, text }` | `{ ok, entry, count }`                     | guest book, word suggestions |
| `signatures` | —               | `{ ok, names }`                            | guest book list              |
| `lookup`     | `{ word }`      | `{ ok, word, defs }` (via the data policy) | word lookup                  |

The site wires the handlers once and passes the bridge to every mount:

```ts
const bridge = createBridge({
	invoke: async (method, payload) => {
		if (method === "submit") return postJson("/api/submissions", payload);
		if (method === "signatures") return getJson("/api/submissions").then(names);
		if (method === "lookup") return getJson(`/api/lookup?word=${encodeURIComponent(payload.word)}`);
		return undefined;
	},
	onEvent: (type, detail) => console.log(`[embed] ${type}`, detail),
});

hydrateEmbed(root, artifact, { ...props, $data }, { bridge });
```

`seed/GuestBook.torp` shows the signed names (refreshed after each
signature); `seed/WordLookup.torp` looks up any word and shows its
definitions. `GET /submissions` lists everything submitted or looked up.
`emit(type, detail)` is also available for fire-and-forget events.

## Embedding an app in a page you own

`/render` is the fragment endpoint; any page can fetch it, inject it, and
hydrate with the artifact:

```html
<script type="module">
	import { hydrateEmbed } from "@torpor/embed";

	const render = await (await fetch("/render?id=wiki-cards&titles=Moon|Mars")).json();
	const artifact = await (await fetch("/artifact.json?id=wiki-cards")).json();
	document.getElementById("deck").innerHTML = render.html;
	hydrateEmbed(document.getElementById("deck"), artifact, {
		...render.props,
		$data: render.data,
	});
</script>
```

## Where the trusted boundary lives

- **The language.** Template expressions are an interpreted AST, never
  `eval`'d. Calls and imports are rejected; unknown identifiers are compile
  errors. Manifests are inert JSON.
- **The data policy.** `createHttpSource` is GET-only, allowlisted by
  origin, credential-by-name, byte/row capped. Origins and secrets live in
  the site.
- **The site.** Storage, routing and HTML are ordinary torpor site code.

## Trust model

Restricted artifacts render with **zero author JS execution**. Clients the
site _does_ trust can ship real JS with the module format
(`compileEmbed({ module: true })` + `mountModuleEmbed`) or be isolated in a
sandboxed iframe (`mountEmbedFrame`) — same loader contract, different tier.
