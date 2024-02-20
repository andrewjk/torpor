import { expect, test } from "vitest";
import watch from "../../src/watch/watch";
import watchEffect from "../../src/watch/watchEffect";

test("watching an array effect", () => {
  const items = watch(["h", "i"]);
  let word = "";
  let lastitem = "";
  watchEffect(() => {
    word = items.join("");
  });
  watchEffect(() => {
    lastitem = items[items.length - 1];
  });
  expect(word).toBe("hi");
  expect(lastitem).toBe("i");

  // Push
  items.push("p");
  expect(word).toBe("hip");
  expect(lastitem).toBe("p");
});
