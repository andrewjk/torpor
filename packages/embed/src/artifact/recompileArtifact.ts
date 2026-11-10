import compileArtifact, { type CompileArtifactOptions } from "./compileArtifact";
import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * Recompiles a stored artifact from its source, stamped with the
 * current runtime version. `meta` is carried over; everything else is
 * regenerated. Idempotent.
 */
export default function recompileArtifact(
	artifact: Pick<EmbedArtifact, "id" | "source" | "meta">,
	options?: Omit<CompileArtifactOptions, "version"> & { version?: string },
): EmbedArtifact {
	const next = compileArtifact(artifact.id, artifact.source, options);
	return { ...next, meta: artifact.meta };
}
