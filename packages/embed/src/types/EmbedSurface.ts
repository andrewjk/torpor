/**
 * The bridge surface an app manifest declares: the methods the embed may
 * `invoke`, the event types it may `emit`, and the push types it may
 * subscribe to with `$embed.on`. Compiled onto the artifact by
 * `compileRestricted` (from the manifest's `api`/`emits`/`pushes`), so the
 * loaders can warn when a mounted embed steps outside its declaration.
 */
export default interface EmbedSurface {
	/** Declared methods (the manifest's `api` keys). */
	api?: string[];
	/** Declared event types (the manifest's `emits`). */
	emits?: string[];
	/** Declared push types (the manifest's `pushes`). */
	pushes?: string[];
}
