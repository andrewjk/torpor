import { renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// HACK: tsdown only creates *.mjs files now (post v0.16), so we need to rename
// the bin/index.mjs file to bin/index.js for it to be run by node

const scriptsFolder = dirname(fileURLToPath(import.meta.url));
const distFolder = resolve(scriptsFolder, "../dist");

renameSync(join(distFolder, "bin", "index.mjs"), join(distFolder, "bin", "index.js"));
renameSync(join(distFolder, "bin", "index.mjs.map"), join(distFolder, "bin", "index.js.map"));
