/**
 * A module an embed imports from, and the local bindings it uses, recorded
 * by the compiler at publish time. The runtime ("@torpor/view") is provided
 * automatically and is not recorded; everything else must be provided by
 * the host at mount/render time via the `scope` option.
 */
export default interface EmbedArtifactImport {
	/**
	 * The module specifier as written in the embed's source.
	 */
	source: string;

	/**
	 * The local binding names the embed's code references, sorted.
	 */
	names: string[];
}
