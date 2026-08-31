/** Converts between color representations used by the picker components */

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

/** Parses "#rgb", "#rrggbb" or "rrggbb"; returns undefined when invalid */
export function parseHex(text: string | undefined | null): string | undefined {
	if (!text) return undefined;
	let value = text.trim().replace(/^#/, "");
	if (value.length === 3) {
		value = value
			.split("")
			.map((c) => c + c)
			.join("");
	}
	if (!/^[0-9a-fA-F]{6}$/.test(value)) return undefined;
	return "#" + value.toLowerCase();
}

export function hexToRgb(hex: string): Rgb {
	const value = parseHex(hex) ?? "#000000";
	return {
		r: parseInt(value.slice(1, 3), 16),
		g: parseInt(value.slice(3, 5), 16),
		b: parseInt(value.slice(5, 7), 16),
	};
}

function toHexPart(n: number): string {
	const clamped = Math.min(255, Math.max(0, Math.round(n)));
	return clamped.toString(16).padStart(2, "0");
}

export function rgbToHex({ r, g, b }: Rgb): string {
	return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
}

/** Blends two colors; amount 0 returns a, 1 returns b */
export function mix(a: string, b: string, amount: number): string {
	const ca = hexToRgb(a);
	const cb = hexToRgb(b);
	const t = Math.min(1, Math.max(0, amount));
	return rgbToHex({
		r: ca.r + (cb.r - ca.r) * t,
		g: ca.g + (cb.g - ca.g) * t,
		b: ca.b + (cb.b - ca.b) * t,
	});
}

/** Perceptual lightness in [0..1], for choosing readable text on swatches */
export function luminance(hex: string): number {
	const { r, g, b } = hexToRgb(hex);
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** A default palette, roughly ordered light to dark */
export const defaultPalette: string[] = [
	"#FFFFFF",
	"#F5F5F5",
	"#D9D9D9",
	"#BFBFBF",
	"#8C8C8C",
	"#595959",
	"#404040",
	"#262626",
	"#0F0F0F",
	"#000000",
	"#FFE4E1",
	"#FFC0CB",
	"#FF7F7F",
	"#FF4040",
	"#E60000",
	"#A61C00",
	"#FFEDCC",
	"#FFD59E",
	"#FFAA33",
	"#E67E00",
	"#B35900",
	"#FFF9C4",
	"#FFF176",
	"#FFEB3B",
	"#FBC02D",
	"#F9A825",
	"#827717",
	"#E8F5E9",
	"#A5D6A7",
	"#66BB6A",
	"#2E7D32",
	"#1B5E20",
	"#0D47A1",
	"#1565C0",
	"#1E88E5",
	"#42A5F5",
	"#90CAF9",
	"#E1BEE7",
	"#CE93D8",
	"#AB47BC",
	"#8E24AA",
	"#4A148C",
];
