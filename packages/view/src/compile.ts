import build from "./compile/build";
import buildType from "./compile/buildType";
import parse from "./compile/parse";
import type CompileError from "./compile/types/CompileError";
import type Component from "./types/Component";
import type Template from "./types/Template";

// Parsing and building
export { parse, build, buildType };

export type { Component, Template, CompileError };
