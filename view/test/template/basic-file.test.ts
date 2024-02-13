import { expect, test } from "vitest";
import parse from "../../src/compile/parse";
import ParseResult from "../../src/types/ParseResult";

// TODO: Preserve space

test("basic file", () => {
  const input = `
<script />

<template />

<style />
`;
  const output = parse(input);
  const expected: ParseResult = {
    ok: true,
    errors: [],
    parts: {
      template: {
        type: "element",
        tagName: "template",
        selfClosed: true,
        attributes: [],
        children: [],
      },
    },
  };
  expect(output).toEqual(expected);
});
