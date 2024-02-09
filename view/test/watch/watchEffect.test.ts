import { expect, test } from "vitest";
import watch from "../../src/watch/watch";
import watchEffect from "../../src/watch/watchEffect";

test("watching a simple effect", () => {
  const person = watch({
    firstName: "Andrew",
    lastName: "Smith",
  });
  let fullName = "";
  const effect = watchEffect(() => {
    fullName = `${person.firstName} ${person.lastName}`;
  });
  expect(fullName).toBe("Andrew Smith");
  person.firstName = "John";
  expect(fullName).toBe("John Smith");
});

test("watching a defined property", () => {
  let person = watch({
    firstName: "Andrew",
    lastName: "Smith",
  });

  person = Object.defineProperty(person, "fullName", {
    get: () => {
      return `${person.firstName} ${person.lastName}`;
    },
  });

  let greeting = "";
  const effect = watchEffect(() => {
    // @ts-ignore TODO
    greeting = `Hi, ${person.fullName}!`;
  });
  expect(greeting).toBe("Hi, Andrew Smith!");
  person.firstName = "John";
  expect(greeting).toBe("Hi, John Smith!");
});

test("watching a getter", () => {
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

test("watching a function", () => {
  const person = watch({
    firstName: "Andrew",
    lastName: "Smith",
    fullName: function () {
      return `${this.firstName} ${this.lastName}`;
    },
  });
  let greeting = "";
  const effect = watchEffect(() => {
    greeting = `Hi, ${person.fullName()}!`;
  });
  expect(greeting).toBe("Hi, Andrew Smith!");
  person.firstName = "John";
  expect(greeting).toBe("Hi, John Smith!");
});

test("setting the same value doesn't call effect again", () => {
  const person = watch({
    firstName: "Andrew",
    lastName: "Smith",
  });
  let fullName = "";
  let counter = 0;
  const effect = watchEffect(() => {
    fullName = `${person.firstName} ${person.lastName}`;
    counter++;
  });
  expect(fullName).toBe("Andrew Smith");
  expect(counter).toBe(1);
  person.firstName = "John";
  expect(fullName).toBe("John Smith");
  expect(counter).toBe(2);
  person.firstName = "John";
  person.firstName = "John";
  person.firstName = "John";
  person.firstName = "John";
  person.firstName = "John";
  expect(fullName).toBe("John Smith");
  expect(counter).toBe(2);
});
