/** Converts between color representations used by the picker components */

/** A named color offered by the palette */
export interface ColorOption {
	/** The color as "#rrggbb" (or "#rrggbbaa") */
	value: string;
	/** An accessible name, instead of reading the hex out character by character */
	name: string;
}

/** A palette entry: either a raw hex string or a named color */
export type Color = string | ColorOption;

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface Rgba extends Rgb {
	/** Alpha in [0..1] */
	a: number;
}

/** Hue in [0..360], saturation and value in [0..1] */
export interface Hsv {
	h: number;
	s: number;
	v: number;
}

/** The hex value of a palette entry */
export function colorValue(color: Color): string {
	return typeof color === "string" ? color : color.value;
}

/** The accessible name of a palette entry */
export function colorName(color: Color): string {
	return typeof color === "string" ? color : color.name;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Parses "#rgb", "#rgba", "#rrggbb", "#rrggbbaa" or the same without the
 * leading "#". Returns a lowercase hex string, with an alpha channel only
 * when it isn't fully opaque, or undefined when invalid.
 */
export function parseHex(text: string | undefined | null): string | undefined {
	if (!text) return undefined;
	let value = text.trim().replace(/^#/, "");
	if (!/^[0-9a-fA-F]+$/.test(value)) return undefined;
	if (value.length === 3 || value.length === 4) {
		value = value
			.split("")
			.map((c) => c + c)
			.join("");
	}
	if (value.length !== 6 && value.length !== 8) return undefined;
	value = value.toLowerCase();
	if (value.length === 8 && value.endsWith("ff")) {
		value = value.slice(0, 6);
	}
	return "#" + value;
}

function parseRgbComponent(text: string): number | undefined {
	if (text.endsWith("%")) {
		const pct = Number(text.slice(0, -1));
		if (!Number.isFinite(pct)) return undefined;
		return clamp(Math.round((pct / 100) * 255), 0, 255);
	}
	const n = Number(text);
	if (!Number.isFinite(n)) return undefined;
	return clamp(Math.round(n), 0, 255);
}

function parseAlphaComponent(text: string | undefined): number {
	if (text === undefined) return 1;
	if (text.endsWith("%")) {
		const pct = Number(text.slice(0, -1));
		return Number.isFinite(pct) ? clamp(pct / 100, 0, 1) : 1;
	}
	const n = Number(text);
	return Number.isFinite(n) ? clamp(n, 0, 1) : 1;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
	const hue = ((h % 360) + 360) % 360;
	const sat = clamp(s, 0, 1);
	const light = clamp(l, 0, 1);
	const c = (1 - Math.abs(2 * light - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = light - c / 2;
	let r = 0;
	let g = 0;
	let b = 0;
	if (hue < 60) [r, g, b] = [c, x, 0];
	else if (hue < 120) [r, g, b] = [x, c, 0];
	else if (hue < 180) [r, g, b] = [0, c, x];
	else if (hue < 240) [r, g, b] = [0, x, c];
	else if (hue < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
	};
}

/**
 * Parses a CSS color: a hex string, `rgb()` / `rgba()`, or `hsl()` /
 * `hsla()`. Returns a normalized hex string with an alpha channel when the
 * color isn't fully opaque.
 */
export function parseColor(text: string | undefined | null): string | undefined {
	if (!text) return undefined;
	const value = text.trim().toLowerCase();
	const hex = parseHex(value);
	if (hex) return hex;

	const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/);
	if (rgbMatch) {
		const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
		if (parts.length < 3) return undefined;
		const [r, g, b] = parts.slice(0, 3).map(parseRgbComponent);
		if (r === undefined || g === undefined || b === undefined) return undefined;
		return rgbaToHex({ r, g, b, a: parseAlphaComponent(parts[3]) });
	}

	const hslMatch = value.match(/^hsla?\(([^)]+)\)$/);
	if (hslMatch) {
		const parts = hslMatch[1].split(/[\s,/]+/).filter(Boolean);
		if (parts.length < 3) return undefined;
		const h = Number(parts[0].replace(/deg$/, ""));
		const s = Number(parts[1].replace(/%$/, ""));
		const l = Number(parts[2].replace(/%$/, ""));
		if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return undefined;
		const rgb = hslToRgb(h, s / 100, l / 100);
		return rgbaToHex({ ...rgb, a: parseAlphaComponent(parts[3]) });
	}

	return undefined;
}

/** Splits a hex color into its channels; invalid values parse as black */
export function hexToRgba(hex: string): Rgba {
	const value = parseHex(hex) ?? "#000000";
	return {
		r: parseInt(value.slice(1, 3), 16),
		g: parseInt(value.slice(3, 5), 16),
		b: parseInt(value.slice(5, 7), 16),
		a: value.length === 9 ? parseInt(value.slice(7, 9), 16) / 255 : 1,
	};
}

/** The alpha of a color in [0..1] */
export function alphaOf(hex: string): number {
	return hexToRgba(hex).a;
}

/** Sets a color's alpha, dropping the channel when it becomes fully opaque */
export function withAlpha(hex: string, alpha: number): string {
	const { r, g, b } = hexToRgba(hex);
	return rgbaToHex({ r, g, b, a: alpha });
}

function toHexPart(n: number): string {
	return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
}

/** Formats channels as a hex color, with alpha only when not fully opaque */
export function rgbToHex({ r, g, b, a = 1 }: Rgba | (Rgb & { a?: number })): string {
	const rgb = `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
	const alpha = Math.round(clamp(a, 0, 1) * 255);
	return alpha === 255 ? rgb : `${rgb}${toHexPart(alpha)}`;
}

export function rgbaToHex(rgba: Rgba): string {
	return rgbToHex(rgba);
}

/** Converts RGB to hue/saturation/value */
export function rgbToHsv({ r, g, b }: Rgb): Hsv {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const delta = max - min;
	let h = 0;
	if (delta !== 0) {
		if (max === rn) h = ((gn - bn) / delta) % 6;
		else if (max === gn) h = (bn - rn) / delta + 2;
		else h = (rn - gn) / delta + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/** Converts hue/saturation/value to RGB */
export function hsvToRgb({ h, s, v }: Hsv): Rgb {
	const hue = ((h % 360) + 360) % 360;
	const sat = clamp(s, 0, 1);
	const val = clamp(v, 0, 1);
	const c = val * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = val - c;
	let r = 0;
	let g = 0;
	let b = 0;
	if (hue < 60) [r, g, b] = [c, x, 0];
	else if (hue < 120) [r, g, b] = [x, c, 0];
	else if (hue < 180) [r, g, b] = [0, c, x];
	else if (hue < 240) [r, g, b] = [0, x, c];
	else if (hue < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
	};
}

/** Converts a hex color to hue/saturation/value */
export function hexToHsv(hex: string): Hsv {
	return rgbToHsv(hexToRgba(hex));
}

/** Converts hue/saturation/value (and alpha) to a normalized hex color */
export function hsvToHex(hsv: Hsv, alpha = 1): string {
	return rgbaToHex({ ...hsvToRgb(hsv), a: alpha });
}

/** A default palette of 6-column rows, each ordered light to dark */
export const defaultPalette: Color[] = [
	{ value: "#ffffff", name: "White" },
	{ value: "#d9d9d9", name: "Light gray" },
	{ value: "#a6a6a6", name: "Gray" },
	{ value: "#737373", name: "Dark gray" },
	{ value: "#404040", name: "Charcoal" },
	{ value: "#000000", name: "Black" },

	{ value: "#ffe4e1", name: "Pale red" },
	{ value: "#ffb3b3", name: "Light red" },
	{ value: "#ff8080", name: "Red" },
	{ value: "#ff4d4d", name: "Bright red" },
	{ value: "#cc0000", name: "Dark red" },
	{ value: "#800000", name: "Maroon" },

	{ value: "#ffedcc", name: "Pale orange" },
	{ value: "#ffd59e", name: "Light orange" },
	{ value: "#ffb366", name: "Orange" },
	{ value: "#ff9900", name: "Amber" },
	{ value: "#cc7a00", name: "Dark orange" },
	{ value: "#804d00", name: "Brown" },

	{ value: "#fff9c4", name: "Pale yellow" },
	{ value: "#fff176", name: "Light yellow" },
	{ value: "#ffe94d", name: "Yellow" },
	{ value: "#ffd600", name: "Gold" },
	{ value: "#ccab00", name: "Dark yellow" },
	{ value: "#665900", name: "Olive" },

	{ value: "#e8f5e9", name: "Pale green" },
	{ value: "#a5d6a7", name: "Light green" },
	{ value: "#66bb6a", name: "Green" },
	{ value: "#2e7d32", name: "Dark green" },
	{ value: "#1b5e20", name: "Deep green" },
	{ value: "#0d3311", name: "Forest" },

	{ value: "#e3f2fd", name: "Pale blue" },
	{ value: "#90caf9", name: "Light blue" },
	{ value: "#42a5f5", name: "Blue" },
	{ value: "#1e88e5", name: "Bright blue" },
	{ value: "#1565c0", name: "Dark blue" },
	{ value: "#0d47a1", name: "Navy" },

	{ value: "#f3e5f5", name: "Pale purple" },
	{ value: "#ce93d8", name: "Light purple" },
	{ value: "#ab47bc", name: "Purple" },
	{ value: "#8e24aa", name: "Dark purple" },
	{ value: "#6a1b9a", name: "Deep purple" },
	{ value: "#4a148c", name: "Violet" },
];
