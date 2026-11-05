import compileEmbed, { type CompileEmbedOptions } from "./compileEmbed";
import type EmbedArtifact from "../types/EmbedArtifact";

/**
 * Recompiles a stored artifact from its source, stamped with the current
 * runtime version. This is the upgrade path: on a @torpor/view bump,
 * `assertRunnable` starts failing for stored artifacts, and this is how
 * they recover.
 *
 * ```ts
 * // serve-time: stale artifacts fail loudly...
 * assertRunnable(artifact, getRuntimeVersion());
 * // ...then recover (in a request, or a bulk job):
 * const fresh = recompileEmbed(artifact);
 * ```
 *
 * `meta` is carried over; everything else is regenerated. Idempotent:
 * recompiling a fresh artifact reproduces it.
 */
export default function recompileEmbed(
	artifact: Pick<EmbedArtifact, "id" | "source" | "meta">,
	options?: Omit<CompileEmbedOptions, "version"> & { version?: string },
): EmbedArtifact {
	const next = compileEmbed(artifact.id, artifact.source, options);
	return { ...next, meta: artifact.meta };
}
