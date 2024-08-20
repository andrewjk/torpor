import fs from "fs";
import { expect } from "vitest";
import buildServer from "../src/compile/buildServer";
import parse from "../src/compile/parse";
import type Component from "../src/compile/types/Component";
import hydrate from "../src/render/hydrate";

export default function hydrateComponent(
  container: HTMLElement,
  path: string,
  component: Component,
  state?: any,
) {
  const source = fs.readFileSync(path).toString();
  const parsed = parse(source);
  expect(parsed.ok).toBe(true);
  expect(parsed.parts).not.toBeUndefined();
  const rendered = buildServer(component.name, parsed.parts!);
  const html = eval(rendered.code).render(state);

  container.innerHTML = html;
  document.body.appendChild(container);

  hydrate(container, component, state);
}
