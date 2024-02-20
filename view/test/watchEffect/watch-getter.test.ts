import { expect, test } from "vitest";
import watch from "../../src/watch/watch";
import watchEffect from "../../src/watch/watchEffect";

test("watching a getter effect", () => {
  const person = watch({
    firstName: "Andrew",
    lastName: "Smith",
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    },
  });
  let greeting = "";
  const effect = watchEffect(() => {
    greeting = `Hi, ${person.fullName}!`;
  });
  expect(greeting).toBe("Hi, Andrew Smith!");
  person.firstName = "John";
  expect(greeting).toBe("Hi, John Smith!");
});
