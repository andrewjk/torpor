import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import { isProxySymbol } from "../../src/watch/internal/symbols";

test("watching a nested object", () => {
  const input = {
    person: {
      name: "Andrew",
    },
  };
  const output = $watch(input);
  expect(output[isProxySymbol]).toBe(true);
  expect(output.person[isProxySymbol]).toBe(true);
});
