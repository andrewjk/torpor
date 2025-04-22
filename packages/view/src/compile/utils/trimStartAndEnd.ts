import trimEnd from "./trimEnd";
import trimStart from "./trimStart";

/**
 * Trims a char from the start and end of the supplied text
 *
 * @param text The text to trim
 * @param startChar The char to remove from the start of the text
 * @param endChar The char to remove from the end of the text
 *
 * @returns The text without the char at the start or the end
 */
export default function trimStartAndEnd(text: string, startChar: string, endChar: string): string {
	return trimEnd(trimStart(text, startChar), endChar);
}
