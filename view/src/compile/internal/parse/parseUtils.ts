import { isAlphaNumericChar, isSpaceChar } from "../utils";
import type ParseStatus from "./ParseStatus";

export function addError(status: ParseStatus, message: string, start: number = status.i) {
  status.errors.push({ message, start });
}

export function consumeSpace(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (!isSpaceChar(status.source, status.i)) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

export function consumeNonSpace(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (isSpaceChar(status.source, status.i)) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

export function consumeWord(status: ParseStatus): string {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (!isAlphaNumericChar(status.source, status.i)) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

export function consumeUntil(value: string, status: ParseStatus) {
  const start = status.i;
  for (status.i; status.i < status.source.length; status.i++) {
    if (value.includes(status.source[status.i])) {
      return status.source.substring(start, status.i);
    }
  }
  return "";
}

export function accept(value: string, status: ParseStatus, advance = true): boolean {
  const check = status.source.substring(status.i, status.i + value.length);
  if (check == value) {
    status.i += advance ? value.length : 0;
    return true;
  }
  return false;
}

export function expect(value: string, status: ParseStatus, advance = true): boolean {
  if (status.i < status.source.length) {
    if (status.source.substring(status.i, status.i + value.length) == value) {
      status.i += advance ? value.length : 0;
      return true;
    } else {
      addError(status, `Expected ${value}`);
    }
  } else {
    addError(status, "Expected token");
  }
  return false;
}
