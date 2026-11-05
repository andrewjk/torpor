/**
 * An embed artifact was built with a different version of @torpor/view than
 * the one that is trying to run it.
 */
export default class EmbedVersionError extends Error {
	/**
	 * The version the artifact was compiled with.
	 */
	artifactVersion: string;

	/**
	 * The version of the runtime that refused to run it.
	 */
	runtimeVersion: string;

	constructor(artifactVersion: string, runtimeVersion: string) {
		super(
			`Embed was compiled with @torpor/view ${artifactVersion}, but the runtime is ${runtimeVersion}. Recompile the embed from its source before running it.`,
		);
		this.name = "EmbedVersionError";
		this.artifactVersion = artifactVersion;
		this.runtimeVersion = runtimeVersion;
	}
}
