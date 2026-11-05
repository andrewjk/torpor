import { createContext, Script } from "node:vm";
import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import compileEmbed from "../src/server/compileEmbed";
import frameDocument, { safeJson } from "../src/frame/frameDocument";
import frameScript from "../src/frame/frameScript";
import mountEmbedFrame from "../src/frame/mountEmbedFrame";
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
	return compileEmbed(id, source);
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
