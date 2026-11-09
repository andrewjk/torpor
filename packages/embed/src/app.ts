/**
 * The author-facing app manifest entry — edge-safe, no Node builtins.
 *
 * `defineApp` types an app declaration and returns it unchanged: the result
 * is plain JSON (id, default props, data requirements), so a host can store
 * it and compile against it without executing anything. This is what lets
 * data live in a typed config file instead of a `data … from http` block
 * inside the .torp, keeping restricted templates plain torpor.
 *
 * ```ts
 * // word-lookup.app.ts — authored by the client, submitted as JSON
 * import { defineApp } from "@torpor/embed/app";
 *
 * export default defineApp({
 * 	id: "word-lookup",
 * 	props: { word: "serendipity" },
 * 	data: {
 * 		entry: {
 * 			kind: "http",
 * 			url: "https://dictionaryapi.com/api/v3/references/collegiate/json",
 * 			params: { word: "$props.word" },
 * 			auth: "mw",
 * 			pick: "0",
 * 			limit: 5,
 * 		},
 * 	},
 * });
 * ```
 */
export { default as defineApp, manifestExpr, manifestRequirements } from "./app/manifest";
export type { AppManifest, ManifestRequirement, ManifestValue } from "./app/manifest";
