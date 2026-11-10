// Embed artifacts: compile to a no-eval server template, render with an
// interpreter. This entry is edge-safe (no Node builtins) — it runs on
// Node, workers (Cloudflare etc.) and in browsers.
export { default as compileArtifact } from "./artifact/compileArtifact";
export { default as renderArtifact } from "./artifact/renderArtifact";
export { default as recompileArtifact } from "./artifact/recompileArtifact";
export { RUNTIME_VERSION } from "./generated/version";
export { default as artifactComponent } from "./artifact/artifactComponent";
export type { ArtifactComponentOptions } from "./artifact/artifactComponent";
export { default as createHttpSource } from "./artifact/http/createHttpSource";
export { default as httpRequirementKind } from "./artifact/http/httpRequirementKind";
export { default as deriveRequirementKind } from "./artifact/derive/deriveRequirementKind";
export type { DeriveLimits } from "./artifact/derive/resolveDerive";
export type {
	HttpCredential,
	HttpOriginPolicy,
	HttpSourceOptions,
} from "./artifact/http/createHttpSource";
// Hosts writing their own requirement kinds need the validator's shape,
// just like the built-in kinds below
export type { RestrictedRequirementKindValidator, RestrictedSpecEntry } from "@torpor/view/compile";
export type { CompileArtifactOptions } from "./artifact/compileArtifact";
export type {
	RenderArtifactOptions,
	ArtifactRenderResult,
	ArtifactSlotRender,
	ArtifactSource,
	ArtifactSourceContext,
	ArtifactAuditEntry,
} from "./artifact/types";

export type { EmbedArtifact, EmbedStyle } from "./types";
