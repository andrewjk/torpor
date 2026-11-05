import { createRequire } from "node:module";

/**
 * Returns the version of the @torpor/view that is installed, read from its
 * package.json. This is the version that artifacts should be stamped with:
 * the compiler that builds the code and the runtime that runs it always
 * come from the same package.
 */
export default function getRuntimeVersion(): string {
	const require = createRequire(import.meta.url);
	const pkg = require("@torpor/view/package.json") as { version: string };
	return pkg.version;
}
