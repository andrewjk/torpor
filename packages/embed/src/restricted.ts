// Restricted-mode embeds: compile to a no-eval server template, render with
// an interpreter. This entry is edge-safe (no Node builtins) — it runs on
// Node, workers (Cloudflare etc.) and in browsers.
export { default as compileRestricted } from "./restricted/compileRestricted";
export { default as renderRestricted } from "./restricted/renderRestricted";
export { default as recompileRestricted } from "./restricted/recompileRestricted";
export { RUNTIME_VERSION } from "./generated/version";
export { default as restrictedComponent } from "./restricted/restrictedComponent";
export type { RestrictedComponentOptions } from "./restricted/restrictedComponent";
export { default as createHttpSource } from "./restricted/http/createHttpSource";
export { default as httpRequirementKind } from "./restricted/http/httpRequirementKind";
export { default as deriveRequirementKind } from "./restricted/derive/deriveRequirementKind";
export type { DeriveLimits } from "./restricted/derive/resolveDerive";
// Hosts writing their own requirement kinds need the validator's shape,
// just like the built-in kinds below
export type { RestrictedRequirementKindValidator, RestrictedSpecEntry } from "@torpor/view/compile";
export type {
	HttpCredential,
	HttpOriginPolicy,
	HttpSourceOptions,
} from "./restricted/http/createHttpSource";
export type { CompileRestrictedOptions } from "./restricted/compileRestricted";
export type {
	RenderRestrictedOptions,
	RestrictedAuditEntry,
	RestrictedRenderResult,
	RestrictedSlotRender,
	RestrictedSource,
	RestrictedSourceContext,
} from "./restricted/types";

export type { EmbedArtifact, EmbedStyle } from "./types";
