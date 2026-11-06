// Restricted-mode embeds: compile to a no-eval server template, render with
// an interpreter. This entry is edge-safe (no Node builtins) — it runs on
// Node, workers (Cloudflare etc.) and in browsers.
export { default as compileRestricted } from "./restricted/compileRestricted";
export { default as renderRestricted } from "./restricted/renderRestricted";
export { default as recompileRestricted } from "./restricted/recompileRestricted";
export type { CompileRestrictedOptions } from "./restricted/compileRestricted";
export type {
	RenderRestrictedOptions,
	RestrictedRenderResult,
	RestrictedSource,
	RestrictedSourceContext,
} from "./restricted/types";

export type { EmbedArtifact, EmbedStyle } from "./types";
