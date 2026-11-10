import compileRestricted, { type CompileRestrictedOptions } from "./compileRestricted";
import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * Recompiles a stored restricted artifact from its source, stamped with the
 * current runtime version. `meta` is carried over; everything else is
 * regenerated. Idempotent.
 */
export default function recompileRestricted(
	artifact: Pick<EmbedArtifact, "id" | "source" | "meta">,
	options?: Omit<CompileRestrictedOptions, "version"> & { version?: string },
): EmbedArtifact {
	const next = compileRestricted(artifact.id, artifact.source, options);
	return { ...next, meta: artifact.meta };
}
