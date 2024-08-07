import { expect, test } from "vitest";
import $watch from "../../src/watch/$watch";
import { isProxySymbol } from "../../src/watch/internal/symbols";

test("watching a simple object", () => {
  const input = {
    name: "Andrew",
  };
  const output = $watch(input);
  expect(output[isProxySymbol]).toBe(true);
});
