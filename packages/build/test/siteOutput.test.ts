import path from "node:path";
import { expect, test } from "vite-plus/test";
import Site from "../src/site/Site";

test("outputFolder defaults to <root>/dist", () => {
	const site = new Site();
	site.root = "/app";
	expect(site.outputFolder).toBe(path.resolve("/app", "dist"));
});

test("outputFolder resolves a relative site.output against the root", () => {
	const site = new Site();
	site.root = "/app";
	site.output = "build/web";
	expect(site.outputFolder).toBe(path.resolve("/app", "build", "web"));
});

test("outputFolder accepts an absolute site.output", () => {
	const site = new Site();
	site.root = "/app";
	site.output = "/elsewhere/out";
	expect(site.outputFolder).toBe(path.resolve("/elsewhere/out"));
});
