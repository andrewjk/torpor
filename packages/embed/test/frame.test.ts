import { createContext, Script } from "node:vm";
import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import compileArtifact from "../src/artifact/compileArtifact";
import frameDocument, { safeJson } from "../src/frame/frameDocument";
import frameScript from "../src/frame/frameScript";
import mountEmbedFrame from "../src/frame/mountEmbedFrame";
import listenEmbedFrame from "../src/frame/listenEmbedFrame";
import type EmbedArtifact from "../src/types/EmbedArtifact";

const SOURCE = `
export default function Counter($props: { start?: number }) {
	let count = $watch({ value: $props.start ?? 0 });
	function increment() {
		count.value++;
	}
	@render {
		<button onclick={increment}>Count: {count.value}</button>
	}
}
`;

function artifact(source = SOURCE, id = "frame-counter"): EmbedArtifact {
	return compileArtifact(id, source);
}

const RUNTIME = "/* runtime bundle */ globalThis.TorporView = { mount() {} };";

function frameEvent(iframe: HTMLIFrameElement, data: unknown): MessageEvent {
	const event = new MessageEvent("message", { data });
	// jsdom's MessageEvent constructor may not accept `source`; set it
	// directly so the host's event.source check sees the frame
	Object.defineProperty(event, "source", { value: iframe.contentWindow });
	return event;
}

test("safeJson escapes script-breaking sequences", () => {
	expect(safeJson({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
	expect(safeJson({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
});

test("frameDocument inlines runtime, artifact, bootstrap and mount call", () => {
	const doc = frameDocument({
		artifact: artifact(),
		props: { start: 5 },
		runtime: RUNTIME,
	});

	expect(doc).toContain("globalThis.TorporView");
	expect(doc).toContain("function Counter");
	expect(doc).toContain("TorporEmbed.mount(");
	expect(doc).toContain('"start":5');
	// The mount call's JSON is script-safe
	expect(doc).not.toMatch(/mount\(\{[^}]*</);
});

test("mountEmbedFrame configures and fills the iframe", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	mountEmbedFrame(iframe, artifact(), { start: 1 }, { runtime: RUNTIME, title: "Post" });

	expect(iframe.getAttribute("sandbox")).toBe("allow-scripts");
	expect(iframe.title).toBe("Post");
	expect(iframe.srcdoc).toContain("function Counter");
	expect(iframe.srcdoc).toContain("TorporEmbed.mount");

	iframe.remove();
});

test("custom sandbox is honored", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{ runtime: RUNTIME, sandbox: "allow-scripts allow-popups" },
	);
	expect(iframe.getAttribute("sandbox")).toBe("allow-scripts allow-popups");

	iframe.remove();
});

test("routes frame events to the bridge, stamped with the artifact id", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const events: { type: string; artifactId: string }[] = [];
	mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			bridge: createBridge({
				onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
			}),
		},
	);

	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "event", type: "clicked" }),
	);

	expect(events).toEqual([{ type: "clicked", artifactId: "frame-counter" }]);
	iframe.remove();
});

test("resolves invokes through the bridge and replies to the frame", async () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const posted: { kind: string; call?: number; value?: unknown; message?: string }[] = [];
	iframe.contentWindow!.postMessage = (message: any) => posted.push(message);

	const calls: string[] = [];
	mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			bridge: {
				emit: () => {},
				invoke: async (method) => {
					calls.push(method);
					return "result-value";
				},
			},
		},
	);

	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "invoke", call: 7, method: "save" }),
	);
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(calls).toEqual(["save"]);
	expect(posted[0]).toEqual({
		channel: "torpor-embed",
		kind: "invoke-result",
		call: 7,
		value: "result-value",
	});

	// Invoke errors come back as invoke-error with the message; use a fresh
	// iframe so the first host handler doesn't also process the call
	const errorIframe = document.createElement("iframe");
	document.body.appendChild(errorIframe);
	const errorPosted: any[] = [];
	errorIframe.contentWindow!.postMessage = (message: any) => errorPosted.push(message);

	mountEmbedFrame(
		errorIframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			bridge: {
				emit: () => {},
				invoke: async () => {
					throw new Error("denied");
				},
			},
		},
	);
	window.dispatchEvent(
		frameEvent(errorIframe, { channel: "torpor-embed", kind: "invoke", call: 8, method: "save" }),
	);
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(errorPosted[0]).toMatchObject({ kind: "invoke-error", call: 8, message: "denied" });
	iframe.remove();
	errorIframe.remove();
});

test("push: subscribe registers with the bridge and relays into the frame", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const posted: any[] = [];
	iframe.contentWindow!.postMessage = (message: any) => posted.push(message);

	const bridge = createBridge({});
	const handle = mountEmbedFrame(iframe, artifact(), {}, { runtime: RUNTIME, bridge });

	// The frame's embed subscribed through the protocol
	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "subscribe", type: "data" }),
	);

	// Broadcast reaches the frame; targeted at another artifact doesn't
	bridge.push("data", { n: 1 });
	bridge.push("data", { n: 2 }, "frame-counter");
	bridge.push("data", { n: 3 }, "other-embed");
	expect(posted).toEqual([
		{ channel: "torpor-embed", kind: "push", type: "data", detail: { n: 1 } },
		{ channel: "torpor-embed", kind: "push", type: "data", detail: { n: 2 } },
	]);

	// A duplicate subscribe is deduped: still one relay per push
	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "subscribe", type: "data" }),
	);
	bridge.push("data", { n: 4 });
	expect(posted.length).toBe(3);

	// Unmounting tears down the subscription
	handle.unmount();
	bridge.push("data", { n: 5 });
	expect(posted.length).toBe(3);

	iframe.remove();
});

test("updates the iframe height", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	mountEmbedFrame(iframe, artifact(), {}, { runtime: RUNTIME });
	window.dispatchEvent(frameEvent(iframe, { channel: "torpor-embed", kind: "height", value: 320 }));

	expect(iframe.style.height).toBe("320px");
	iframe.remove();
});

test("ignores messages from other sources", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const events: string[] = [];
	mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			bridge: createBridge({ onEvent: (type) => events.push(type) }),
		},
	);

	// From our own window (not the frame)
	const fromSelf = new MessageEvent("message", {
		data: { channel: "torpor-embed", kind: "event", type: "spoofed" },
	});
	Object.defineProperty(fromSelf, "source", { value: window });
	window.dispatchEvent(fromSelf);

	// Not on our channel
	window.dispatchEvent(frameEvent(iframe, { channel: "other", kind: "event", type: "noise" }));

	expect(events).toEqual([]);
	iframe.remove();
});

test("unmount stops listening and clears the frame", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const events: string[] = [];
	const handle = mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			bridge: createBridge({ onEvent: (type) => events.push(type) }),
		},
	);

	handle.unmount();
	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "event", type: "late" }),
	);

	expect(events).toEqual([]);
	expect(iframe.hasAttribute("srcdoc")).toBe(false);
	iframe.remove();
});

test("host css is injected before the artifact's styles", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			css: [":root { --accent: red; }", "body { font-family: sans-serif; }"],
		},
	);

	const doc = iframe.srcdoc;
	expect(doc).toContain(":root { --accent: red; }");
	expect(doc).toContain("body { font-family: sans-serif; }");
	// Host theme first, artifact styles after (so the embed can override)
	expect(doc.indexOf("--accent")).toBeLessThan(doc.indexOf("Count:"));
	iframe.remove();
});

test("rejects scope: host components cannot cross the frame boundary", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	expect(() =>
		mountEmbedFrame(iframe, artifact(), {}, {
			runtime: RUNTIME,
			scope: { "@host/ui": {} },
		} as any),
	).toThrow(/cannot cross the frame boundary/);

	iframe.remove();
});

test("frameDocument applies the CSP nonce to script and style tags", () => {
	const doc = frameDocument({
		artifact: artifact(),
		props: {},
		runtime: RUNTIME,
		nonce: "abc123",
	});

	const nonceCount = doc.split('nonce="abc123"').length - 1;
	// runtime script + artifact script + bootstrap + mount call (this
	// artifact has no styles, so no style tag)
	expect(nonceCount).toBe(4);
	// The src variant gets the nonce too
	const srcDoc = frameDocument({
		artifact: artifact(),
		props: {},
		runtimeUrl: "/r.js",
		nonce: "abc123",
	});
	expect(srcDoc).toMatch(/<script nonce="abc123" src="\/r\.js"><\/script>/);
});

test("listenEmbedFrame works standalone for URL-served frames", async () => {
	// A host that serves the frame document from its own URL sets iframe.src
	// itself and pairs it with the listener
	const iframe = document.createElement("iframe");
	iframe.src = "https://author.example/apps/poll/frame";
	document.body.appendChild(iframe);

	const posted: any[] = [];
	iframe.contentWindow!.postMessage = (message: any) => posted.push(message);
	const events: { type: string; artifactId: string }[] = [];
	const calls: string[] = [];

	const listener = listenEmbedFrame(iframe, {
		artifactId: "frame-counter",
		bridge: createBridge({
			onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
			invoke: async (method) => {
				calls.push(method);
				return "polled";
			},
		}),
		maxHeight: 200,
	});

	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "event", type: "voted" }),
	);
	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "invoke", call: 1, method: "submit" }),
	);
	window.dispatchEvent(frameEvent(iframe, { channel: "torpor-embed", kind: "height", value: 900 }));
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(events).toEqual([{ type: "voted", artifactId: "frame-counter" }]);
	expect(calls).toEqual(["submit"]);
	expect(posted[0]).toMatchObject({ kind: "invoke-result", call: 1, value: "polled" });
	// maxHeight clamps the frame's reported height
	expect(iframe.style.height).toBe("200px");

	listener.dispose();
	window.dispatchEvent(
		frameEvent(iframe, { channel: "torpor-embed", kind: "event", type: "late" }),
	);
	expect(events.length).toBe(1);
	iframe.remove();
});

test("requires exactly one runtime source", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	expect(() => mountEmbedFrame(iframe, artifact(), {}, {} as any)).toThrow("exactly one");
	expect(() =>
		mountEmbedFrame(iframe, artifact(), {}, { runtime: RUNTIME, runtimeUrl: "/r.js" }),
	).toThrow("exactly one");

	iframe.remove();
});

test("runtimeUrl is served from a script src instead of inlined", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	mountEmbedFrame(iframe, artifact(), {}, { runtimeUrl: "/runtime/torpor-view.iife.js" });

	const doc = iframe.srcdoc;
	expect(doc).toContain('<script src="/runtime/torpor-view.iife.js"></script>');
	// Nothing inlined: the srcdoc stays small regardless of runtime size
	expect(doc).not.toContain("TorporView = ");
	expect(doc).toContain("function Counter"); // artifact code still inline

	iframe.remove();
});

test("runtimeUrl is attribute-escaped", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	mountEmbedFrame(iframe, artifact(), {}, { runtimeUrl: '/runtime?a="1"&b<2' });

	expect(iframe.srcdoc).toContain('src="/runtime?a=&quot;1&quot;&amp;b&lt;2"');
	iframe.remove();
});

test("frame bootstrap mounts and speaks the protocol", async () => {
	// Run the frame script in a fake window (node:vm) standing in for the
	// sandboxed iframe
	const listeners: ((event: { data?: unknown; source?: unknown }) => void)[] = [];
	const posted: any[] = [];
	const mounted: { target: unknown; name: unknown; props: unknown }[] = [];

	const fakeWindow: Record<string, any> = {
		parent: { postMessage: (message: any) => posted.push(message) },
		addEventListener: (type: string, listener: any) => {
			if (type === "message") listeners.push(listener);
		},
		TorporView: {
			mount: (target: unknown, name: unknown, props: unknown) =>
				mounted.push({ target, name, props }),
		},
	};
	fakeWindow.window = fakeWindow;
	fakeWindow.document = {
		getElementById: () => ({ id: "torpor-embed" }),
		documentElement: { scrollHeight: 240 },
		body: {},
	};

	const context = createContext(fakeWindow);
	new Script(frameScript).runInContext(context);

	// The artifact's code would have declared the component as a global
	// (classic script top-level function)
	fakeWindow.Counter = function Counter() {};

	// Mount goes through TorporView with the injected target (the component
	// itself, resolved from the artifact's global)
	(fakeWindow.TorporEmbed as { mount(o: any): void }).mount({
		id: "e1",
		name: "Counter",
		props: { start: 2 },
	});
	expect(mounted).toEqual([
		{ target: { id: "torpor-embed" }, name: expect.any(Function), props: { start: 2 } },
	]);

	// Height was reported to the parent
	expect(posted[0]).toEqual({ channel: "torpor-embed", kind: "height", value: 240 });

	// invoke posts a call and resolves when the host replies
	const pending = (fakeWindow.TorporEmbed as any).bridge.invoke("fetch-data", { q: 1 });
	expect(posted[1]).toMatchObject({
		channel: "torpor-embed",
		kind: "invoke",
		call: 1,
		method: "fetch-data",
	});
	listeners.forEach((listener) =>
		listener({
			source: fakeWindow.parent,
			data: { channel: "torpor-embed", kind: "invoke-result", call: 1, value: "the data" },
		}),
	);
	await expect(pending).resolves.toBe("the data");

	// invoke errors reject
	const failing = (fakeWindow.TorporEmbed as any).bridge.invoke("boom");
	listeners.forEach((listener) =>
		listener({
			source: fakeWindow.parent,
			data: { channel: "torpor-embed", kind: "invoke-error", call: 2, message: "nope" },
		}),
	);
	await expect(failing).rejects.toThrow("nope");

	// Messages from elsewhere are ignored
	(fakeWindow.TorporEmbed as any).bridge.invoke("spoof");
	listeners.forEach((listener) =>
		listener({
			source: {},
			data: { channel: "torpor-embed", kind: "invoke-result", call: 3, value: "hijacked" },
		}),
	);
});

test("frame bridge on() subscribes once per type and delivers pushes locally", () => {
	const listeners: ((event: { data?: unknown; source?: unknown }) => void)[] = [];
	const posted: any[] = [];
	const fakeWindow: Record<string, any> = {
		parent: { postMessage: (message: any) => posted.push(message) },
		addEventListener: (type: string, listener: any) => {
			if (type === "message") listeners.push(listener);
		},
		TorporView: { mount: () => {} },
	};
	fakeWindow.window = fakeWindow;
	fakeWindow.document = {
		getElementById: () => ({ id: "torpor-embed" }),
		documentElement: { scrollHeight: 10 },
		body: {},
	};

	const context = createContext(fakeWindow);
	new Script(frameScript).runInContext(context);

	const seen: unknown[] = [];
	const off = (fakeWindow.TorporEmbed as any).bridge.on("data", (detail: unknown) =>
		seen.push(["first", detail]),
	);
	// Exactly one subscribe message, sent on the first on()
	expect(posted.filter((m: any) => m.kind === "subscribe")).toEqual([
		{ channel: "torpor-embed", kind: "subscribe", type: "data" },
	]);

	// A second handler for the same type does not re-subscribe
	(fakeWindow.TorporEmbed as any).bridge.on("data", (detail: unknown) =>
		seen.push(["second", detail]),
	);
	expect(posted.filter((m: any) => m.kind === "subscribe").length).toBe(1);

	// A host push delivers to both handlers
	listeners.forEach((listener) =>
		listener({
			source: fakeWindow.parent,
			data: { channel: "torpor-embed", kind: "push", type: "data", detail: 7 },
		}),
	);
	expect(seen).toEqual([
		["first", 7],
		["second", 7],
	]);

	// Unsubscribe removes only that handler
	off();
	listeners.forEach((listener) =>
		listener({
			source: fakeWindow.parent,
			data: { channel: "torpor-embed", kind: "push", type: "data", detail: 8 },
		}),
	);
	expect(seen).toEqual([
		["first", 7],
		["second", 7],
		["second", 8],
	]);

	// Pushes for types nobody subscribed to are ignored
	listeners.forEach((listener) =>
		listener({
			source: fakeWindow.parent,
			data: { channel: "torpor-embed", kind: "push", type: "other", detail: 9 },
		}),
	);
	expect(seen.length).toBe(3);
});

test("full protocol round-trip: frame invoke reaches the host bridge and back", async () => {
	// A fake frame (vm) against a real host (jsdom iframe)
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const listeners: ((event: { data?: unknown; source?: unknown }) => void)[] = [];
	const posted: any[] = [];
	const fakeWindow: Record<string, any> = {
		parent: { postMessage: (message: any) => posted.push(message) },
		addEventListener: (type: string, listener: any) => {
			if (type === "message") listeners.push(listener);
		},
		TorporView: { mount: () => {} },
	};
	fakeWindow.window = fakeWindow;
	fakeWindow.document = {
		getElementById: () => ({}),
		documentElement: { scrollHeight: 10 },
		body: {},
	};
	new Script(frameScript).runInContext(createContext(fakeWindow));

	// The host receives messages whose source is the frame's contentWindow
	const deliver = (message: any) => {
		const event = new MessageEvent("message", { data: message });
		Object.defineProperty(event, "source", { value: iframe.contentWindow });
		window.dispatchEvent(event);
	};

	// The host posts its reply to the frame's contentWindow; spy on it
	const replies: any[] = [];
	iframe.contentWindow!.postMessage = (message: any) => replies.push(message);

	mountEmbedFrame(
		iframe,
		artifact(),
		{},
		{
			runtime: RUNTIME,
			bridge: {
				emit: () => {},
				invoke: async (method) => `handled:${method}`,
			},
		},
	);

	const reply = (fakeWindow.TorporEmbed as any).bridge.invoke("save-form", { name: "ada" });
	// Frame -> host: the frame posted the invoke to its parent; deliver it
	// into the host window the way the browser would
	deliver(posted[0]);
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Host -> frame: deliver the reply the host posted to the frame
	expect(replies[0]).toMatchObject({ kind: "invoke-result", value: "handled:save-form" });
	listeners.forEach((listener) => listener({ source: fakeWindow.parent, data: replies[0] }));

	await expect(reply).resolves.toBe("handled:save-form");
	iframe.remove();
});
