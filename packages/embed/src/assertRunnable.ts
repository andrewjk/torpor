import type EmbedArtifact from "./types/EmbedArtifact";
import checkVersion from "./checkVersion";

/**
 * Serve-time compatibility check: verifies that a stored artifact can run
 * against the @torpor/view that is currently deployed. Call this when serving
 * an artifact (e.g. before rendering it server-side), so stale artifacts
 * fail loudly instead of breaking subtle runtime internals.
 *
 * If this throws, recompile the artifact from `artifact.source`.
 *
 * @param artifact The stored artifact
 * @param currentVersion The version of the deployed @torpor/view
 * @param options Set `allowMismatch` to warn and continue instead of throw
 */
export default function assertRunnable(
	artifact: Pick<EmbedArtifact, "version">,
	currentVersion: string,
	options?: { allowMismatch?: boolean },
): void {
	checkVersion(artifact.version, currentVersion, options);
}
