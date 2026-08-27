/**
 * Masked input plumbing: masks are strings where token characters accept
 * user input and everything else is a literal.
 *
 * - `9` -- digit (0-9)
 * - `L` -- letter (a-z, case preserved)
 * - `a` -- alphanumeric
 * - `\x` -- the literal character x
 */

export interface MaskToken {
	/** Literal characters render as-is; tokens accept input */
	literal: boolean;
	char: string;
	pattern?: RegExp;
}

/** Splits a mask into literal/token parts */
export function parseMask(mask: string): MaskToken[] {
	const tokens: MaskToken[] = [];
	for (let i = 0; i < mask.length; i++) {
		const char = mask[i];
		if (char === "\\" && i + 1 < mask.length) {
			tokens.push({ literal: true, char: mask[i + 1] });
			i++;
			continue;
		}
		switch (char) {
			case "9":
				tokens.push({ literal: false, char, pattern: /[0-9]/ });
				break;
			case "L":
				tokens.push({ literal: false, char, pattern: /[A-Za-z]/ });
				break;
			case "a":
				tokens.push({ literal: false, char, pattern: /[A-Za-z0-9]/ });
				break;
			default:
				tokens.push({ literal: true, char });
		}
	}
	return tokens;
}

/** The characters a mask can hold, ignoring literals */
export function tokenCount(tokens: MaskToken[]): number {
	return tokens.filter((t) => !t.literal).length;
}

/**
 * Walks user-entered text against the mask, keeping only characters that
 * fit the remaining slots. Typing ahead of literals works because missing
 * literals are skipped, so `5551234` formats like `(555) 123-4`.
 */
export function extractRaw(tokens: MaskToken[], text: string): string {
	let result = "";
	let ti = 0;

	for (const ch of text) {
		if (ti >= tokens.length) break;

		// Skip forward to the first token this character satisfies
		while (ti < tokens.length && tokens[ti].literal && tokens[ti].char !== ch) {
			ti++;
		}
		const token = tokens[ti];
		if (!token) break;

		if (token.literal) {
			// The user typed the literal itself
			ti++;
			continue;
		}
		if (!token.pattern!.test(ch)) continue;

		result += ch;
		ti++;
	}
	return result;
}

/** Builds the displayed text from raw input characters */
export function formatMask(tokens: MaskToken[], raw: string): string {
	let result = "";
	let index = 0;
	let lastFilledEnd = 0;

	for (let i = 0; i < tokens.length && index < raw.length; i++) {
		const token = tokens[i];
		if (token.literal) {
			result += token.char;
			continue;
		}
		result += raw[index++];
		lastFilledEnd = result.length;
	}
	return result.slice(0, lastFilledEnd);
}
