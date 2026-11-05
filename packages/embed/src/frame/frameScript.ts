/**
 * The script that runs inside a sandboxed iframe embed. Inlined into the
 * frame's document by mountEmbedFrame, after the runtime bundle and the
 * artifact's client code, and driven by a final
 * `TorporEmbed.mount({...})` call.
 *
 * Written as plain ES5-style JavaScript (no imports, no template literals)
 * so it works as a classic script and so this file stays a plain string.
 *
 * Protocol (all messages carry `channel: "torpor-embed"`):
 * - frame -> host: { kind: "event", type, detail }
 *                  { kind: "invoke", call, method, payload }
 *                  { kind: "height", value }
 * - host -> frame: { kind: "invoke-result", call, value }
 *                  { kind: "invoke-error", call, message }
 */
const frameScript: string = String.raw`
(function () {
	"use strict";
	var CHANNEL = "torpor-embed";
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

	var bridge = {
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
	};

	function reportHeight() {
		post({ kind: "height", value: document.documentElement.scrollHeight });
	}

	window.TorporEmbed = {
		bridge: bridge,
		mount: function (options) {
			var target = document.getElementById("torpor-embed");
			if (!target) throw new Error('Frame is missing its #torpor-embed target');
			var component = window[options.name];
			if (typeof component !== "function") {
				throw new Error(
					'Embed "' + options.id + '" does not contain a component named "' + options.name + '"'
				);
			}
			TorporView.mount(target, component, options.props);
			reportHeight();
			if (typeof ResizeObserver === "function") {
				new ResizeObserver(reportHeight).observe(document.body);
			}
		},
	};
})();
`;

export default frameScript;
