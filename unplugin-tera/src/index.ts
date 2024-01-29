import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import build from "../../view/src/compile/build";
import parse from "../../view/src/compile/parse";
import type { Options } from "./types";

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options) => ({
  name: "unplugin-tera",
  transformInclude(id) {
    //return id.endsWith('main.ts')
    return /\.tera$/.test(id);
  },
  transform(code) {
    //return code.replace('__UNPLUGIN__', `Hello Unplugin! ${options}`)
    const parsed = parse(code);
    if (parsed.ok && parsed.syntaxTree) {
      const built = build("Demo", parsed.syntaxTree);
      // TODO: Compile typescript if script lang="ts" or config.lang="ts"
      return built;
    } else {
      throw new Error("Uh");
    }
  },
});

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
