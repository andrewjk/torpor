import EmbedVersionError from "./types/EmbedVersionError";

/**
 * Compiled embed code references the runtime's internal helpers (`t_anchor`,
 * `t_fragment` etc.), which change between releases. The safe policy is
 * therefore exact: an artifact runs only against the runtime version it was
 * compiled with. If it doesn't match, recompile it from `artifact.source`.
 *
 * @param artifactVersion The version the artifact was compiled with
 * @param runtimeVersion The version of the runtime that will run it
 * @param options Set `allowMismatch` to log a warning and continue (e.g. for
 * a preview environment) instead of throwing
 *
 * @throws EmbedVersionError when the versions don't match
 */
export default function checkVersion(
	artifactVersion: string,
	runtimeVersion: string,
	options?: { allowMismatch?: boolean },
): void {
	if (artifactVersion === runtimeVersion) return;
	if (options?.allowMismatch) {
		console.warn(
			`[torpor/embed] Version mismatch: embed compiled with @torpor/view ${artifactVersion}, runtime is ${runtimeVersion}. Running anyway (allowMismatch).`,
		);
		return;
	}
	throw new EmbedVersionError(artifactVersion, runtimeVersion);
}
