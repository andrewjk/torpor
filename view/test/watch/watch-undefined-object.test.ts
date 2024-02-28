import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";

test("watching an undefined object", () => {
  const input = undefined;
  // @ts-ignore
  const output = $watch(input);
  expect(output).toBe(undefined);
});
