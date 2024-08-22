import fs from "fs";
import path from "path";
import { expect } from "vitest";
import build from "../src/compile/build";
import buildServer from "../src/compile/buildServer";
import parse from "../src/compile/parse";
import type Component from "../src/compile/types/Component";
import hydrate from "../src/render/hydrate";

export default function hydrateComponent(
  container: HTMLElement,
  componentPath: string,
  component: Component,
  state?: any,
) {
  const source = fs.readFileSync(componentPath).toString();
  const parsed = parse(source);
  expect(parsed.ok).toBe(true);
  expect(parsed.parts).not.toBeUndefined();

  const imports = parsed
    .parts!.imports?.map((imp) => {
      let importPath = path.join(path.dirname(componentPath), imp.path);
      let importSource = fs.readFileSync(importPath).toString();
      let importParsed = parse(importSource);
      expect(importParsed.ok).toBe(true);
      expect(importParsed.parts).not.toBeUndefined();
      const importServer = buildServer(imp.name, importParsed.parts!);
      return importServer.code;
    })
    .join("\n");

  const server = buildServer(component.name, parsed.parts!);
  const code = `
const x = {
render: ($state) => {
${imports}
${server.code}

return ${component.name}.render($state);
}
};

x;`;
  const html = eval(code).render(state).replaceAll(/\s+/g, " ");
  //console.log("===");
  //console.log(html);
  //console.log("===");

  // Write everything to files so we can keep an eye on regressions
  // TODO: Should probably have a script instead
  const folder = componentPath.replace("/components/", "/components/output/");
  if (!fs.existsSync(path.dirname(folder))) {
    fs.mkdirSync(path.dirname(folder));
  }
  fs.writeFileSync(folder.replace(".tera", "-server.ts"), server.code);
  //fs.writeFileSync(folder.replace(".tera", ".html"), html);
  const client = build(component.name, parsed.parts!);
  fs.writeFileSync(folder.replace(".tera", "-client.ts"), client.code);

  container.innerHTML = html;
  document.body.appendChild(container);

  hydrate(container, component, state);
}
