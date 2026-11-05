/**
 * The source of a bridge call: which embed it came from. Filled in by the
 * loader when it scopes a bridge to a mounted artifact.
 */
export default interface EmbedEventSource {
	artifactId: string;
}
