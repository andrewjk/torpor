/** Converts between color representations used by the picker components */

/** A named color offered by the palette */
export interface ColorOption {
	/** The color as "#rrggbb" (or "#rgb") */
	value: string;
	/** An accessible name, instead of reading the hex out character by character */
	name: string;
}

/** A palette entry: either a raw hex string or a named color */
export type Color = string | ColorOption;

/** The hex value of a palette entry */
export function colorValue(color: Color): string {
	return typeof color === "string" ? color : color.value;
}

/** The accessible name of a palette entry */
export function colorName(color: Color): string {
	return typeof color === "string" ? color : color.name;
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
