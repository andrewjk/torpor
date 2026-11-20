import { createRequire } from "node:module";
import path from "node:path";

/**
 * The shape of the `@torpor/check` module that `tb --check` uses.
 */
type Diagnostic = {
	path: string;
	message: string;
	code?: number;
	range: {
		start: { line: number; character: number };
		end: { line: number; character: number };
	};
	lineText?: string;
};

type CheckModule = {
	check: (folder: string) => Diagnostic[];
	printErrors: (folder: string, errors: Diagnostic[]) => void;
};

/**
 * Type-checks the site's `.ts` and `.torp` files with `@torpor/check`, which
 * compiles each component to TypeScript and reports diagnostics mapped back
 * to the source. This is the check that `tsc --noEmit` can't do: a `.torp`
 * file isn't part of the tsconfig program, so its script block is only ever
 * checked by the editor.
 *
 * `@torpor/check` is deliberately not a dependency of `@torpor/build` (it
 * pulls in a full TypeScript install), so it is resolved from the site's own
 * dependencies. When it's missing, the command says what to install instead
 * of failing mysteriously.
 */
export default function runCheck(workingDir: string): void {
	const require = createRequire(path.join(workingDir, "package.json"));
	let checker: CheckModule;
	try {
		checker = require("@torpor/check") as CheckModule;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		// Anything else is a real load error (e.g. a broken dependency of the
		// checker itself), which shouldn't be dressed up as advice
		if (!message.includes("@torpor/check")) {
			throw error;
		}
		console.log(
			`@torpor/check is not installed, so the site's .torp files can't be type-checked.\n` +
				`Install it as a dev dependency (e.g. "npm install -D @torpor/check") and run tb --check again.`,
		);
		process.exitCode = 1;
		return;
	}

	const errors = checker.check(workingDir);
	if (errors.length > 0) {
		checker.printErrors(workingDir, errors);
		console.log(`Found ${errors.length} error${errors.length === 1 ? "" : "s"}`);
		process.exitCode = 1;
	} else {
		console.log("No errors found");
	}
}
