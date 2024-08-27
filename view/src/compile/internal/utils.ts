// From https://stackoverflow.com/a/55292366
export function trimAny(input: string, chars: string): string {
	let totrim = Array.from(chars);
	let start = 0;
	let end = input.length;
	while (start < end && totrim.indexOf(input[start]) >= 0) {
		start += 1;
	}
	while (end > start && totrim.indexOf(input[end - 1]) >= 0) {
		end -= 1;
	}
	return start > 0 || end < input.length ? input.substring(start, end) : input;
}

export function trimQuotes(text: string) {
	while (
		(text.startsWith("'") && text.endsWith("'")) ||
		(text.startsWith('"') && text.endsWith('"'))
	) {
		text = text.substring(1, text.length - 1).trim();
	}
	return text;
}

export function trimMatched(text: string, start: string, end: string) {
	while (text.startsWith(start) && text.endsWith(end)) {
		text = text.substring(start.length, text.length - end.length).trim();
	}
	return text;
}

export function trimStart(text: string, value: string) {
	while (text.startsWith(value)) {
		text = text.substring(value.length).trim();
	}
	return text;
}

export function trimEnd(text: string, value: string) {
	while (text.endsWith(value)) {
		text = text.substring(0, text.length - value.length).trim();
	}
	return text;
}

export function trimStartAndEnd(text: string, start: string, end: string) {
	return trimEnd(trimStart(text, start), end);
}
