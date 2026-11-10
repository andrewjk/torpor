import build from "./compile/build";
import buildRestricted from "./compile/build/restricted/buildRestricted";
import buildType from "./compile/buildType";
import parse from "./compile/parse";
import bindDataTemplate from "./compile/parse/bindDataTemplate";
import {
	parseExpressionPrefix,
	RestrictedSyntaxError,
} from "./compile/build/restricted/parseExpression";
import type CompileError from "./compile/types/CompileError";
import type Component from "./types/Component";
import type Template from "./types/Template";

// Parsing and building
export { parse, build, buildType, buildRestricted, bindDataTemplate };
// Restricted expression parsing, for hosts that carry manifest strings as
// expression source (e.g. derive requirements in app manifests)
export { parseExpressionPrefix, RestrictedSyntaxError };

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
	RestrictedSpecEntry,
	RestrictedStaticAttribute,
} from "./compile/build/restricted/types";
