import fs from "fs";
import path from "path";
import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import build from "../../view/src/compile/build";
import parse from "../../view/src/compile/parse";
import type { Options } from "./types";

const styles = new Map<string, string>();

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => ({
  name: "unplugin-tera",
  resolveId(id /*, importer, options*/) {
    if (styles.has(id)) {
      return id;
    }
    return undefined;
  },
  load(id) {
    if (styles.has(id)) {
      return styles.get(id);
    }
    return undefined;
  },
  transformInclude(id) {
    // Check for *.tera files
    return /\.tera$/.test(id);
  },
  transform(code, id) {
    const parsed = parse(code);
    if (parsed.ok && parsed.parts) {
      const name = id
        .split(/[\\\/]/)
        .at(-1)
        ?.replace(/\.tera$/, "");
      // TODO: Compile typescript if script lang="ts" or config.lang="ts"
      const built = build(name!, parsed.parts);
      let transformed = built.code;

      // HACK: Replace random paths with absolute paths
      if (transformed.includes("../../../tera")) {
        const pathParts = id.split(/[\\\/]/);
        for (let i = pathParts.length - 1; i >= 0; i--) {
          let pathToCheck = path.resolve(path.join(...["/", ...pathParts.slice(0, i), "tera"]));
          if (fs.existsSync(pathToCheck)) {
            transformed = transformed.replaceAll(/from ("|')(..\/)+tera/g, `from $1${pathToCheck}`);
            break;
          }
        }
      }

      if (built.styles && built.styleHash) {
        // Add a dynamic import for the component's CSS with a name from the hash and add the styles to a map
        // Then resolveId will pass the CSS id onto load, which will load the the actual CSS from the map
        transformed = `import '${built.styleHash}.css';\n` + transformed;
        styles.set(built.styleHash + ".css", built.styles);
      }

      return transformed;
    } else {
      console.log("\nERRORS\n======");
      for (let error of parsed.errors) {
        //const line = (input.slice(0, error.i).match(/\n/g) || "").length + 1;
        let slice = code.slice(0, error.start);
        let line = 1;
        let last_line_index = 0;
        for (let i = 0; i < slice.length; i++) {
          if (code[i] === "\n") {
            line += 1;
            last_line_index = i;
          }
        }
        console.log(`${line},${error.start - last_line_index - 1}: ${error.message}`);
      }
      throw new Error("Uh oh");
    }
  },
});

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
