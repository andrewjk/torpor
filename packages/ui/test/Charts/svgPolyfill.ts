// jsdom doesn't implement SVG getBBox, which the chart components use to
// measure axis label text. Approximate it so charts render in tests.
if (typeof globalThis.SVGElement !== "undefined") {
	const proto = globalThis.SVGElement.prototype as any;
	if (typeof proto.getBBox !== "function") {
		proto.getBBox = function () {
			const text = typeof this.textContent === "string" ? this.textContent.trim() : "";
			return { width: text.length * 8, height: 16 };
		};
	}
}

export {};
