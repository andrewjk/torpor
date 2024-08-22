import fs from "fs";
import { dirname } from "path";
import { expect } from "vitest";
import build from "../src/compile/build";
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
  const server = buildServer(component.name, parsed.parts!);
  const html = eval(server.code).render(state);
  //console.log("===");
  //console.log(html);
  //console.log("===");

  // Write everything to files so we can keep an eye on regressions
  // TODO: Should probably have a script instead
  const folder = path.replace("/components/", "/components/output/");
  if (!fs.existsSync(dirname(folder))) fs.mkdirSync(dirname(folder));
  fs.writeFileSync(folder.replace(".tera", "-server.ts"), server.code);
  //fs.writeFileSync(folder.replace(".tera", ".html"), html);
  const client = build(component.name, parsed.parts!);
  fs.writeFileSync(folder.replace(".tera", "-client.ts"), client.code);

  container.innerHTML = html;
  document.body.appendChild(container);

  hydrate(container, component, state);
}
