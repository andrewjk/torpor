/**
 * The author-facing app manifest entry — edge-safe, no Node builtins.
 *
 * `defineApp` types an app declaration and returns it unchanged: the result
 * is plain JSON (id, default props, data requirements, declared bridge
 * surface), so a host can store it and compile against it without executing
 * anything. Data lives in a typed config file, keeping restricted templates
 * plain torpor, and the declared surface turns "what this app may do" into
 * something a host can review and the compiler can enforce.
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
export { default as defineApp, manifestRequirements } from "./app/manifest";
export type {
	AppManifest,
	ManifestApiMethod,
	ManifestRequirement,
	ManifestValue,
} from "./app/manifest";
