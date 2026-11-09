import build from "./compile/build";
import buildRestricted from "./compile/build/restricted/buildRestricted";
import buildType from "./compile/buildType";
import parse from "./compile/parse";
import { bindDataTemplate } from "./compile/parse/parseRequirement";
import type CompileError from "./compile/types/CompileError";
import type Component from "./types/Component";
import type Template from "./types/Template";

// Parsing and building
export { parse, build, buildType, buildRestricted, bindDataTemplate };

export type { Component, Template, CompileError };
export type { RestrictedBuildOptions } from "./compile/build/restricted/buildRestricted";
export type {
	RestrictedAttribute,
	RestrictedBuildResult,
	RestrictedComponent,
	RestrictedDynamicAttribute,
	RestrictedExpr,
	RestrictedNode,
	RestrictedProgram,
	RestrictedRequirement,
	RestrictedRequirementKindValidator,
	RestrictedStaticAttribute,
} from "./compile/build/restricted/types";
export type { RestrictedSpecEntry } from "./compile/build/restricted/parseRequirementSpec";
