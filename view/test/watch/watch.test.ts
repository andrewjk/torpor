import { expect, test } from "vitest";
import watch from "../../src/watch/watch";

test("watching a simple object", () => {
  const input = {
    name: "Andrew",
  };
  const output = watch(input);
  // @ts-ignore $isProxy is hidden
  expect(output.$isProxy).toBe(true);
});

test("watching a nested object", () => {
  const input = {
    person: {
      name: "Andrew",
    },
  };
  const output = watch(input);
  // @ts-ignore $isProxy is hidden
  expect(output.$isProxy).toBe(true);
  // @ts-ignore $isProxy is hidden
  expect(output.person.$isProxy).toBe(true);
});

test("watching a null object", () => {
  const input = null;
  // @ts-ignore
  const output = watch(input);
  expect(output).toBe(null);
});

test("watching an undefined object", () => {
  const input = undefined;
  // @ts-ignore
  const output = watch(input);
  expect(output).toBe(undefined);
});

test("getting a null property", () => {
  const input = {
    name: null,
  };
  const output = watch(input);
  expect(output.name).toBe(null);
});

test("getting an undefined property", () => {
  const input = {};
  const output = watch(input);
  // @ts-ignore
  expect(output.name).toBe(undefined);
});
