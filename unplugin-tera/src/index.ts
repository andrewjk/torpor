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
  transform(code /*, id*/) {
    const parsed = parse(code);
    if (parsed.ok && parsed.parts) {
      // TODO: Compile typescript if script lang="ts" or config.lang="ts"
      const built = build("Demo", parsed.parts);
      let transformed = built.code;

      if (built.styles && built.styleHash) {
        // Add a dynamic import for the component's CSS with a name from the hash and add the styles to a map
        // Then resolveId will pass the CSS id onto load, which will load the the actual CSS from the map
        transformed = `import '${built.styleHash}.css';\n` + transformed;
        styles.set(built.styleHash + ".css", built.styles);
      }

      return transformed;
    } else {
      throw new Error("Uh");
    }
  },
});

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
