import { EMBED_CHANNEL } from "./protocol";

/**
 * Builds the frame-side protocol bootstrap as a standalone classic script:
 * the postMessage bridge (`TorporEmbed.bridge.emit`/`.invoke`), the
 * invoke call-id correlation, and the auto-height reporter (initial report
 * on load + `ResizeObserver` on body).
 *
 * Unlike `frameScript`, there is no `TorporEmbed.mount()` and no reference
 * to `TorporView` -- use this for frame documents that are not built by
 * `frameDocument()` (raw HTML/CSS/JS documents served from their own
 * origin). The host's own shim can then speak the protocol in terms of
 * `window.TorporEmbed.bridge`, e.g.:
 *
 * ```html
 * <script>${frameBridgeScript}</script>
 * <script>
 * 	window.redraft = {
 * 		submit: (payload) => window.TorporEmbed.bridge.invoke("submit", payload),
 * 	};
 * </script>
 * ```
 *
 * Call `TorporEmbed.reportHeight()` (or resize the body) after content
 * changes; an initial report is made when the document finishes loading.
 *
 * The channel defaults to `EMBED_CHANNEL` and must match the channel the
 * host's listener filters on -- mismatches fail silently (unknown channels
 * are ignored).
 */
function createFrameBridgeScript(channel: string = EMBED_CHANNEL): string {
	return String.raw`(function () {
	"use strict";
	var CHANNEL = ${JSON.stringify(channel)};
	var parent = window.parent;
	var calls = {};
	var callId = 0;

	function post(message) {
		var data = { channel: CHANNEL };
		for (var key in message) data[key] = message[key];
		parent.postMessage(data, "*");
	}

	window.addEventListener("message", function (event) {
		// Only accept messages from our direct parent
		if (event.source !== parent) return;
		var data = event.data;
		if (!data || data.channel !== CHANNEL) return;
		if (data.kind === "invoke-result" || data.kind === "invoke-error") {
			var pending = calls[data.call];
			if (!pending) return;
			delete calls[data.call];
			if (data.kind === "invoke-error") pending.reject(new Error(data.message));
			else pending.resolve(data.value);
		}
	});

	function reportHeight() {
		post({ kind: "height", value: document.documentElement.scrollHeight });
	}

	if (document.readyState === "complete") reportHeight();
	else window.addEventListener("load", reportHeight);

	if (typeof ResizeObserver === "function") {
		new ResizeObserver(reportHeight).observe(document.body);
	}

	window.TorporEmbed = {
		reportHeight: reportHeight,
		bridge: {
			emit: function (type, detail) {
				post({ kind: "event", type: type, detail: detail });
			},
			invoke: function (method, payload) {
				return new Promise(function (resolve, reject) {
					var id = ++callId;
					calls[id] = { resolve: resolve, reject: reject };
					post({ kind: "invoke", call: id, method: method, payload: payload });
				});
			},
		},
	};
})();`;
}

/**
 * The frame-side protocol bootstrap for the default channel. For frame
 * documents built by `frameDocument()` this runs before the mount glue;
 * hosts serving their own frame documents can inline it directly.
 */
export const frameBridgeScript: string = createFrameBridgeScript();
export { frameBridgeScript as default, createFrameBridgeScript };
