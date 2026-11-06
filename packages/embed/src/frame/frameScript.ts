import { EMBED_CHANNEL } from "./protocol";
import { createFrameBridgeScript } from "./frameBridgeScript";

/**
 * The mount glue for frame documents built by `frameDocument()`: adds
 * `TorporEmbed.mount()` on top of the protocol bootstrap. The bootstrap
 * script must run first (it defines `TorporEmbed`).
 */
function createFrameMountScript(): string {
	return String.raw`(function () {
	"use strict";
	var target = document.getElementById("torpor-embed");
	if (!target) throw new Error('Frame is missing its #torpor-embed target');

	window.TorporEmbed.mount = function (options) {
		var component = window[options.name];
		if (typeof component !== "function") {
			throw new Error(
				'Embed "' + options.id + '" does not contain a component named "' + options.name + '"'
			);
		}
		TorporView.mount(target, component, options.props);
		TorporEmbed.reportHeight();
	};
})();`;
}

/**
 * Builds the full frame script for frame documents built by
 * `frameDocument()`: the protocol bootstrap plus the component mount glue.
 * The channel must match the host listener's channel.
 */
function createFrameScript(channel: string = EMBED_CHANNEL): string {
	return `${createFrameBridgeScript(channel)}\n${createFrameMountScript()}`;
}

/**
 * The full frame script for the default channel.
 */
export const frameScript: string = createFrameScript();
export { frameScript as default, createFrameScript };
