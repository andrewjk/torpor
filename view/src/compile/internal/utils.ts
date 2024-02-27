export function isSpace(input: string) {
  for (let i = 0; i < input.length; i++) {
    if (!isSpaceChar(input, i)) {
      return false;
    }
  }
  return true;
}

export function isSpaceChar(input: string, i: number) {
  let code = input.charCodeAt(i);
  return code === 32 || (code >= 9 && code <= 13);
}

export function isAlphaNumeric(input: string) {
  for (let i = 0; i < input.length; i++) {
    if (!isAlphaNumericChar(input, i)) {
      return false;
    }
  }
  return true;
}

export function isAlphaNumericChar(input: string, i: number) {
  let code = input.charCodeAt(i);
  return (
    // 0-9
    (code > 47 && code < 58) ||
    // A-Z
    (code > 64 && code < 91) ||
    // a-z
    (code > 96 && code < 123)
  );
}

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
  text = text.trim();
  while (
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith('"') && text.endsWith('"'))
  ) {
    text = text.substring(1, text.length - 1).trim();
  }
  return text;
}

export function trimMatched(text: string, start: string, end: string) {
  text = text.trim();
  while (text.startsWith(start) && text.endsWith(end)) {
    text = text.substring(start.length, text.length - end.length).trim();
  }
  return text;
}
