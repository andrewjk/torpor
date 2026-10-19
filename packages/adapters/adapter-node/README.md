# torpor/adapter-node

A @torpor/build adapter for running on Node.

🚧 WARNING: WORK IN PROGRESS 🚧

## Installation

Install the adapter using `npm` (or your preferred package manager):

```bash
npm install @torpor/adapter-node
```

Then use the adapter in your `site.config`:

```javascript
import { node } from "@torpor/adapter-node";
import { Site } from "@torpor/build";

const site: Site = new Site();
site.adapter = node;
```

## Streaming and upgrades

`ReadableStream` response bodies are streamed to the client as they arrive, so
server-sent events work. HTTP upgrade requests (WebSockets) are routed to the
same fetch handler with the raw Node socket pair available from
`upgradePair(request)`. Complete the handshake yourself (e.g. with `ws`'s
`handleUpgrade`) and return a `101` response; any other status is sent to the
client and the socket is closed:

```javascript
import { upgradePair } from "@torpor/adapter-node";

export async function get(event) {
	const pair = upgradePair(event.request);
	if (!pair) return new Response("Expected an upgrade", { status: 400 });

	// e.g. wss.handleUpgrade(event.request, pair.socket, pair.head, ...)
	return new Response(null, { status: 101 });
}
```
