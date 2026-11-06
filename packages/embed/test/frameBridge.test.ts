import { createContext, Script } from "node:vm";
import { expect, test } from "vite-plus/test";
import createBridge from "../src/bridge/createBridge";
import type { EmbedApi, EmbedApiBridge } from "../src/bridge/apiTypes";
import { EMBED_CHANNEL } from "../src/frame/protocol";
import { createFrameBridgeScript, frameBridgeScript } from "../src/frame/frameBridgeScript";
import listenEmbedFrame from "../src/frame/listenEmbedFrame";

/** Runs the frame-side bootstrap in a fake window (node:vm) standing in
 * for a raw-HTML frame document: no TorporView global at all. */
function bootFrame(channel?: string) {
	const listeners: { type: string; listener: (event: any) => void }[] = [];
	const posted: any[] = [];
	const parent = { postMessage: (message: any) => posted.push(message) };
	const fakeWindow: Record<string, any> = {
		parent,
		addEventListener: (type: string, listener: any) => {
			listeners.push({ type, listener });
		},
	};
	fakeWindow.window = fakeWindow;
	fakeWindow.document = {
		documentElement: { scrollHeight: 240 },
		body: {},
	};
	const script = channel ? createFrameBridgeScript(channel) : frameBridgeScript;
	new Script(script).runInContext(createContext(fakeWindow));

	return {
		embed: fakeWindow.TorporEmbed as {
			bridge: {
				emit(type: string, detail?: unknown): void;
				invoke(method: string, payload?: unknown): Promise<any>;
			};
			reportHeight(): void;
		},
		parent,
		postToFrame: (data: unknown, source?: unknown) => {
			for (const { type, listener } of listeners) {
				if (type === "message") listener({ source: source ?? fakeWindow.parent, data });
			}
		},
		load: () => {
			for (const { type, listener } of listeners) {
				if (type === "load") listener({ type: "load" });
			}
		},
		posted,
	};
}

test("frameBridgeScript exposes the bridge without TorporView or mount", () => {
	const frame = bootFrame();
	expect(typeof (frame.embed.bridge as { emit: unknown }).emit).toBe("function");
	expect(typeof (frame.embed.bridge as { invoke: unknown }).invoke).toBe("function");
	expect(typeof frame.embed.reportHeight).toBe("function");
	expect((frame.embed as Record<string, unknown>).mount).toBeUndefined();
});

test("reports height on document load and on explicit reportHeight", () => {
	const frame = bootFrame();

	frame.load();
	expect(frame.posted).toEqual([{ channel: EMBED_CHANNEL, kind: "height", value: 240 }]);

	frame.embed.reportHeight();
	expect(frame.posted[1]).toEqual({ channel: EMBED_CHANNEL, kind: "height", value: 240 });
});

test("round-trips invoke against listenEmbedFrame over a custom channel", async () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const frame = bootFrame("redraft:app");
	const replies: any[] = [];
	iframe.contentWindow!.postMessage = (message: any) => replies.push(message);

	const listener = listenEmbedFrame(iframe, {
		artifactId: "redraft-app",
		channel: "redraft:app",
		maxHeight: 300,
		bridge: createBridge({
			onEvent: () => {},
			invoke: async (method) => `handled:${method}`,
		}),
	});

	// Frame -> host: the frame posted to its parent; deliver it into the
	// host window the way the browser would
	const deliver = (message: any) => {
		const event = new MessageEvent("message", { data: message });
		Object.defineProperty(event, "source", { value: iframe.contentWindow });
		window.dispatchEvent(event);
	};

	const reply = frame.embed.bridge.invoke("submit", { answer: 42 });
	deliver(frame.posted.find((m) => m.kind === "invoke")!);
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(replies[0]).toMatchObject({
		channel: "redraft:app",
		kind: "invoke-result",
		value: "handled:submit",
	});

	// Host -> frame
	frame.postToFrame(replies[0]);
	await expect(reply).resolves.toBe("handled:submit");
	listener.dispose();
	iframe.remove();
});

test("ignores other sources and unknown channels", async () => {
	const frame = bootFrame();
	const reply = frame.embed.bridge.invoke("submit");

	// Wrong source: never resolved (anything that isn't the direct parent
	// is ignored)
	frame.postToFrame(
		{ channel: EMBED_CHANNEL, kind: "invoke-result", call: 1, value: "hijacked" },
		{ notTheParent: true },
	);
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Right source, wrong channel: ignored (the frame only ever hears from
	// its parent, but the data carries a channel it doesn't listen on)
	frame.postToFrame({ channel: "other", kind: "invoke-result", call: 1, value: "hijacked" });

	let settled = false;
	void reply.then(() => (settled = true));
	await new Promise((resolve) => setTimeout(resolve, 10));
	expect(settled).toBe(false);

	// Settle cleanly so no rejection dangles
	frame.postToFrame({ channel: EMBED_CHANNEL, kind: "invoke-result", call: 1, value: "ok" });
	await expect(reply).resolves.toBe("ok");
});

test("invoke errors reject with the host's message", async () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const frame = bootFrame();
	const replies: any[] = [];
	iframe.contentWindow!.postMessage = (message: any) => replies.push(message);

	const listener = listenEmbedFrame(iframe, {
		artifactId: "redraft-app",
		bridge: createBridge({
			onEvent: () => {},
			invoke: async () => {
				throw new Error("denied");
			},
		}),
	});

	const reply = frame.embed.bridge.invoke("submit");
	{
		const event = new MessageEvent("message", { data: frame.posted[0] });
		Object.defineProperty(event, "source", { value: iframe.contentWindow });
		window.dispatchEvent(event);
	}
	await new Promise((resolve) => setTimeout(resolve, 10));

	frame.postToFrame(replies[0]);
	await expect(reply).rejects.toThrow("denied");
	listener.dispose();
	iframe.remove();
});

test("events are forwarded to the host bridge", () => {
	const iframe = document.createElement("iframe");
	document.body.appendChild(iframe);

	const events: { type: string; artifactId: string }[] = [];
	const listener = listenEmbedFrame(iframe, {
		artifactId: "raw-frame",
		bridge: createBridge({
			onEvent: (type, _detail, source) => events.push({ type, artifactId: source.artifactId }),
		}),
	});

	const event = new MessageEvent("message", {
		data: { channel: EMBED_CHANNEL, kind: "event", type: "voted" },
	});
	Object.defineProperty(event, "source", { value: iframe.contentWindow });
	window.dispatchEvent(event);

	expect(events).toEqual([{ type: "voted", artifactId: "raw-frame" }]);
	listener.dispose();
	iframe.remove();
});

// R2.5: the API contract is a pure type -- one definition shared between
// host and embed author, checked at compile time.
type SectionApi = {
	"fetch-data": { result: string };
	"save-section": { payload: { name: string }; result: "ok" };
};
const sectionApi: EmbedApi = {
	"fetch-data": { result: "the data" },
	"save-section": { payload: undefined, result: "ok" },
};

test("typed bridge: known methods are payload- and result-typed", async () => {
	const bridge: EmbedApiBridge<SectionApi> = createBridge({
		onEvent: () => {},
		invoke: async (method, payload) => {
			if (method === "save-section") {
				expect((payload as { name: string }).name).toBe("ada");
				return "ok" as const;
			}
			return "the data";
		},
	});

	const data: string = await bridge.invoke("fetch-data");
	const ok: "ok" = await bridge.invoke("save-section", { name: "ada" });
	expect(data).toBe("the data");
	expect(ok).toBe("ok");
	expect(sectionApi["fetch-data"].result).toBe("the data");
});

test("typed bridge: unknown methods are a compile-time error", () => {
	const bridge: EmbedApiBridge<SectionApi> = createBridge({ onEvent: () => {} });
	// @ts-expect-error "nope" is not in the contract
	expect(() => bridge.invoke("nope")).toBeDefined();
});
