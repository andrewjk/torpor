import { execSync } from "node:child_process";
import path from "node:path";

// The committed files under test/*/components/output are compiler-generated
// "goldens": every test run recompiles the test components and rewrites them
// in place (see buildOutputFiles.ts). If a tracked golden differs from HEAD
// after the run, compiler output changed without the regenerated files being
// committed -- which would otherwise only surface as unnoticed git noise.
export async function setup(): Promise<void> {}

export async function teardown(): Promise<void> {
	// Enforce only in CI: locally this would fail every test run while a
	// compiler change is mid-flight (the goldens regenerate on each run but
	// aren't committed until the change is done). CI sets `CI=true`, so
	// drift still fails remote builds. Run locally with `CI=1 pnpm test` to
	// opt in.
	if (!process.env.CI) {
		return;
	}

	let changed: string;
	try {
		changed = execSync("git diff --name-only", {
			// The test dir sits two levels under the package root, which in turn
			// sits in the repo
			cwd: path.resolve(import.meta.dirname, "../.."),
			encoding: "utf8",
		}).trim();
	} catch {
		// Not a git checkout (e.g. a published tarball) -- nothing to check
		return;
	}

	const outputs = changed.split("\n").filter((f) => f.includes("/components/output/"));
	if (outputs.length) {
		throw new Error(
			`${outputs.length} generated test output file(s) differ from the committed versions ` +
				`after the test run:\n${outputs.map((f) => `  ${f}`).join("\n")}\n` +
				`Compiler output changed -- commit the regenerated files under test/*/components/output.`,
		);
	}
}
