import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function find(relative: string): string | null {
	// import.meta.dirname survives vite-node/vitest; fall back for runtimes
	// that only define import.meta.url
	const dir: string = (import.meta as any).dirname ?? fileURLToPath(new URL(".", import.meta.url));
	const candidate = join(dir, relative);
	return existsSync(candidate) ? candidate : null;
}

/**
 * Locates the bundled worker script. When the package runs from dist, the
 * worker sits next to server.mjs; when tests run the src directly, it's in
 * ../../dist.
 */
export default function resolveWorkerPath(): string {
	// Built: dist/server.mjs and dist/renderWorker.mjs are siblings
	const built = find("renderWorker.mjs");
	if (built) return built;

	// Tests run the src directly; the worker is in dist
	const fromSrc = find(join("..", "..", "dist", "renderWorker.mjs"));
	if (fromSrc) return fromSrc;

	throw new Error(
		"renderWorker.mjs not found -- build @torpor/embed first (pnpm build in packages/embed)",
	);
}
