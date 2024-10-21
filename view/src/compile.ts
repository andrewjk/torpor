import build from "./compile/build";
import buildType from "./compile/buildType";
import parse from "./compile/parse";
import type Component from "./types/Component";
import type ComponentTemplate from "./types/ComponentTemplate";

// Parsing and building
export { parse, build, buildType };

export type { Component, ComponentTemplate };
